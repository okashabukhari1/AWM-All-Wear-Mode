# AWM verification

Executed on 10 October 2026 using the local Vite application and the Codex in-app browser.

## Automated checks

- TypeScript and Vite production build.
- 10 state tests: catalogue integrity, variant merging, stock limits, quantity changes, LocalStorage rehydration, checkout totals/inventory/order snapshots, insufficient-stock prevention, product CRUD, order status propagation, and password-free demo profiles.
- One reduced-motion static rendering test: content and shopping links remain present without the intro overlay. The browser's operating-system motion setting was not emulated; this test is a rendering check, not a claim of full OS-level motion QA.

## Executed browser flows

- Header search for denim, women/category filter combination, descending price sorting.
- Product size and colour selection, quantity increase, wishlist save, and add to bag.
- Refresh preserves the wishlist count, cart quantity, and Black / M variant.
- Empty checkout submission reports invalid required fields through native form validation.
- Checkout with fictitious test details creates an order, clears the bag, and totals PKR 13,180 for two PKR 6,590 pieces with complimentary delivery.
- Admin order status set to Shipped appears in customer tracking.
- Admin variant inventory set to zero disables the corresponding size on the storefront.
- Product create appears in storefront; price edit appears in the product details; temporary QA products were deleted.
- Demo registration with the order email shows the appropriate order history.
- Quick view adds a size-selected piece and opens one cart dialog.
- Mobile navigation opens, follows the Women link, and closes.
- Mobile filter drawer applies the Shirts filter and closes with four matching products.
- Demo sign-out/sign-in returns to the expected profile; Escape closes the size-guide dialog.
- Newsletter submission displays the explicit local-demo acknowledgement.
- The current hero uses one master pin; source frames advance and reverse with scroll, and navigation cleans up the pin. Its outline frames and connector are removed.

## Routes and widths

All 28 static/representative routes were loaded with rendered heading content at 390px: Men, Women, New Arrivals, Trending, a collection, a product, Search, Wishlist, Cart, Checkout, Login, Register, Account, Orders, About, Contact, FAQ, Shipping/Returns, Privacy, Terms, 404, and all admin pages including create/edit. Home and the dynamic order confirmation/tracking routes were exercised separately.

Home, populated Checkout, and Admin Overview were checked at 320, 375, 390, 430, 768, 1024, 1280, 1440, and 1920px. One 320px checkout overflow was found and fixed by allowing form/grid children to shrink. That case was rechecked successfully. No horizontal document overflow was observed in the other cases. Horizontal product/gallery/category scrolling is intentional within contained rails.

No browser warning or error messages were captured during the rendered-route pass. Images use responsive sources and a local labelled reference fallback. Exact SKU imagery, visual review on physical devices, real identity/payment/fulfilment, and production SEO remain outside this frontend prototype.

The browser contains clearly named QA demo records from purchase testing; these are local only. Clear site data to reset to the initial catalogue.

## Current refinement verification

- Production build and all 11 tests passed after the shared GSAP motion pass; the static rendering test also asserts that no cinema-frame markup remains.
- 26 representative routes were reloaded at both 320px and 1440px, with heading content and zero horizontal document overflow. See `route-audit.json` for the executed paths and collected links. No warning/error logs were captured in this pass.
- Homepage checked at 320, 375, 390, 430, 768, 1024, 1280, 1440 and 1920px: zero horizontal overflow, zero cinema-frame nodes, no overflowing testimonial text.
- Source-frame progression observed forward and backward. The store anchor reaches frame 180/progress 1; reloading at #perspective retains the final pose and lands below the header.
- The earlier critical-asset loader reached measured 100% and exited. That loader was replaced by the full website boot gate described below.
- Card Black colour selection carried into quick view. Black / M was added to the bag and confirmed in its line item; that QA addition was removed afterward. Existing wishlist/order records were preserved.
- Desktop dialog confirmed body-level portal, full viewport placement, opacity 1 and selected Black colour; no clipping from card hover transforms.
- Round carousel previous/next controls wrap, pause works, and pointer dragging moved from story 3 to story 5 before settling. Mobile front-card copy fits, and vertical page scrolling remains available.
- Instagram enquiry link navigates to /contact?platform=Instagram with Social profile links selected and the request text prefilled. Official profiles remain unspecified; these are enquiry links, not invented social accounts.
- Shared route motion shows visible content at settled opacity 1, including typography and section links. Dynamic content is registered through a child-list observer; route and reduced-motion cleanup revert GSAP styles.
- Screenshots saved for desktop/mobile hero, footer, and testimonials. Reduced-motion was checked by static rendering and source lifecycle review, not by changing the user's operating-system preference.

## Minimal centered hero

- Removed every lateral outfit tween, the outfit scale transition, and the mobile top transition. Its transform stays translate(0px, 0px) throughout the pinned sequence.
- Desktop observed source frames 1 → 38 → 92 → 160, then 126 when scrolling backward. Pinned outfit bounds stayed constant (the initial unpinned position differs by the announcement bar's 30px height). Mobile observed 1 → 45 → 133 with the same X position at every sample.
- Reduced hero copy to “Your mode,” a small edit/season label, two short shopping links, and Discover. Removed both descriptive paragraphs, the repeated brand slogan, badge and top metadata.
- Masked headline lines, staggered supporting controls, a cream-to-peach background and soft circular reveal surround the fixed canvas. Hidden starting states are set before paint so delayed elements do not flash before their entrances.
- 320×667, 375×812, 390×844, 430×932, and desktop widths 768/1024/1280/1440/1920: no horizontal overflow, no clipped title, both shopping links remain inside the hero, and circle centering error is below 0.001px.
- Saved latest desktop and mobile captures as awm-minimal-hero-desktop.jpg and awm-minimal-hero-mobile.jpg.


## Website readiness and Admin navigation

- Production build and all 18 tests passed: the previous 11 checks plus seven readiness checks for final-task completion, request concurrency, cancellation, required-asset failure, image deduplication, viewport pose coverage, and page/font readiness.
- On fresh Home loads and refreshes, the observed loader showed measured progress while the app shell stayed hidden and inert. After it exited, every homepage image had complete=true and a nonzero naturalWidth, fonts were loaded, and the walking canvas reported ready.
- Direct Admin and product URL loads showed the loader, then their correct route content with loaded images and fonts. In-app navigation did not replay it.
- Desktop Admin navbar link, mobile Admin header link, and the mobile menu Admin link all opened /admin. The menu closed after navigation.
- Navbar checked at 320, 768, 1024, and 1440px: no horizontal document overflow or overlapping header controls. Browser console recorded no warnings/errors during this pass.
- Mocked asynchronous tests kept readiness pending while fonts were delayed and rejected a missing walking frame. Browser network failure interception and OS-level reduced-motion emulation were not performed.
- Captures: loader-readiness-desktop.png, loader-readiness-mobile.png, navbar-admin-desktop.png, navbar-admin-mobile.png.
## Compact full-width product ring

- Production build and 21 tests passed: 10 shopping-state checks, seven readiness checks, reduced-motion rendering, and three ring navigation math checks. The static rendering check confirms the dissolve component is absent.
- The ring contains complete product cards with compact image height and names, category, price, colour swatches, wishlist and size selection. The gallery fills the section width and leaves top/bottom clearance around the cards.
- Desktop keyboard End selects product 8; Next wraps to product 1. Native pointer dragging selects a different product without navigating away.
- Active card Black colour selection carries into quick view. Black / M adds to the bag and appears in the cart line item; the QA addition was removed afterward.
- Mobile quick view opens, and the wishlist button toggles its pressed state. The temporary wishlist selection was reversed.
- The product image opens its product route. Inactive cards remain inert; their outer hit surface selects the card. Flattening each card surface preserves working button hit targets inside the 3D ring, and dialogs remain outside the transformed gallery via the existing portal.
- 320px, 390px and 1440px document widths were checked without horizontal overflow. Desktop center card rendered at approximately 321px high with 115px clearance above/below; mobile center card at approximately 361px with 75px clearance above/below.
- Scroll Dissolve Reveal and its Three.js/Fiber/Drei dependencies were removed. The campaign renders as an ordinary editorial image with its collection action. No dissolve canvas or sticky dissolve track remains.
- Captures: awm-product-ring-desktop.png and awm-product-ring-mobile.png. Reduced motion is verified by static rendering, not OS preference emulation; physical touch-device testing was not performed.

## Tighter ring spacing

- Product widths now scale with the full gallery width, and the ring radius uses a smaller spacing allowance. This keeps cards close together while retaining the short 420px source height and full-width stage.
- At 1440px, the gap between the center product and its immediate neighbour measured about 20px (previously about 140px). At 390px the same gap measured about 11px; the document had no horizontal overflow.
- Desktop Black colour selection and size-picker opening were rechecked; mobile size-picker opening was rechecked. Existing shopping controls remain intact.
- Production build passed. Desktop/mobile ring screenshots were updated.

## Compact Lightswind hover gallery

- Installed 3d-hover-gallery through the requested Lightswind CLI and adapted the supplied source's expanding/tilting panels to actual AWM products. Removed the old ring component, footer controls, rotation helpers and their three obsolete tests.
- The gallery is centered and capped at 1,040px. Expanded cards are capped at 320px; the observed 1440px desktop card was 280px wide and 420px high. This replaces the previous full-width expanding layout.
- Pointer selection expands another product with angled neighbours. Keyboard End selects the eighth product; ArrowRight wraps to the first. Mouse focus and card controls use separate hit targets.
- Black colour selection carries into quick view. Adding Black / M appears in the bag with the correct product and price; the QA addition was removed afterward.
- At 390px, selecting the next product scrolls it into the visible gallery. Mobile quick view opens; wishlist state toggles and was restored. View piece navigates to the matching product and rendered heading.
- At 320px the expanded panel fits its gallery container at approximately 237px wide, including all product controls, with zero horizontal document overflow. At 390px it is 280px wide. Horizontal overflow is contained inside the gallery.
- Reduced motion retains a static product grid. The OS setting and physical touch hardware were not emulated; reduced motion is covered by the static-rendering test.
- Production build and all 18 remaining tests passed: shopping state, readiness and static rendering. Captures: awm-hover-gallery-desktop.png and awm-hover-gallery-mobile.png.

## Modest fashion imagery and smoother hover

- The eight featured products now use local Pexels fashion references: traditional menswear and contemporary hijab styling. Gallery and linked product/quick-view surfaces share their catalogue image data. Credits are in fashion-image-sources.md.
- Removed the instant active-card minimum-width change. Width, neighbouring tilt, zoom, shade and image filters use the same 650ms easing curve; pointer selection has 80ms intent and leaving has a short grace period. Product copy fades in after expansion starts.
- Browser observations captured intermediate expansion widths from 121px through 176px, 216px and 263px to 276px, rather than an immediate jump. A pointer drag into a card selected it with no gallery control focused, verifying hover activation separately from keyboard selection.
- At 1440px, the gallery stayed 1040px wide and its expanded card measured about 278px. All eight local images loaded. Quick view displayed the matching local image.
- At 390px, the selected card settled at 280px with no horizontal document overflow. The product link opened the matching women’s piece with its new local photo. No browser warnings or errors were captured. Desktop and mobile screenshots were updated.
- Production build and all 19 tests passed, including a storage-version migration test preserving cart, wishlist, profile, edited price/stock and an admin image upload.

## Startup and asset optimization — 10 October 2026

- Production build and all 36 tests passed across five files. Readiness tests cover the entry route, critical poses, visible images, lazy below-fold images, font completion, failure and cancellation. Route selection, legacy URL mapping, custom uploads and existing shopping-state tests also pass.
- Replaced the earlier all-route/all-image/all-pose boot gate with the current entry module, visible/eager images, fonts, fallback and seven spaced Home poses. Admin and other direct routes do not fetch hero frames. Reduced-motion Home remains static. In-app navigation does not replay the loader.
- Startup Home JavaScript is approximately 160 KB gzip, versus approximately 232 KB when the earlier loader also requested all route modules. The 114.70 KB gallery chunk (39.40 KB gzip) is deferred until its section is within 600px. Fixed placeholder height reserves its layout space.
- Verified all 72 local responsive WebP variants and their declared widths. The 24 default 900px photos total 1,531,028 bytes versus 8,097,176 bytes for downloaded/source originals (81% less; resizing and compression combined). Custom admin image URLs remain unchanged.
- All 180 mobile frame files total 3,248,152 bytes versus 11,350,450 previously (71% less). Seven critical poses total 123,146 mobile bytes and 137,900 desktop bytes. Seven poses on light/dark backgrounds were visually checked in optimized-walk-proof.jpg; alpha and the stationary outfit composition remain intact.
- The walking canvas reuses prepared images and retains at most 48 decoded frames. Production browser scrolling advanced to frame 54, then returned to frame 1 on reverse scrolling. Remaining frames load after readiness with requested poses promoted in the queue.
- Final desktop Home readiness was observed at 678–783ms, direct Admin at 514ms, and mobile Home at 621ms on local production preview. These are local observations with ordinary browser caching, not cold-network or throttled Lighthouse results. No deployed hosting performance measurement was made.
- Desktop catalogue navigation rendered 24 products. Stone / M quick-add appeared in the bag with the correct product and price; that QA item was removed. Direct Admin rendered the 48-product overview without a walking canvas.
- At 1440px the compact hover gallery loaded all eight local 480px WebPs and displayed product controls. At 390px its selected panel settled at 280px wide with no horizontal document overflow. Tapping another card and View piece opened the matching product and loaded its local image. No warning/error browser logs were captured.
- Fonts use self-hosted WOFF2 files; primary-family preload URLs resolve to hashed build assets. No default image/font external request is needed. Netlify/Cloudflare-style cache headers are supplied in public/_headers; hosts that do not consume this file need equivalent configuration.
- Captures: optimized-home-desktop.png, optimized-home-mobile.png, optimized-gallery-desktop.png, optimized-gallery-mobile.png and optimized-walk-proof.jpg. Reduced motion was checked through static rendering and source lifecycle review; OS preference emulation and physical touch-device testing were not performed.
