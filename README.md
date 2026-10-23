# 🌱 AgroShield — Farm & Garden E-Commerce Platform

A complete, responsive **full-stack agricultural e-commerce website** built with the **MERN-style stack** (Express + MongoDB + vanilla HTML/CSS/JS). AgroShield is an online marketplace for farmers, gardeners and agricultural customers, organised into **seven main categories** — Seeds, Crop Protection, Crop Nutrition, Equipments, Animal Husbandry, Organic and Tapas — with **80 subcategories** in a validated three-level taxonomy (main category → heading → subcategory). The catalogue holds **695 active products**: 110 clearly-labelled demo listings plus **585 real-brand listings imported from the shop owner's product photographs** (see [Real catalogue import](#-real-catalogue-import-images--prices--ratings)).

> **Internship demo project.** All brands, prices and crop-protection label data are clearly labelled demonstration data. See [Demo data & legal notice](#-demo-data--legal-notice) before any real-world use.

---

## ✨ Features

### Login (entry page)
- **`/` is a single welcome/login page** — one *Login* button (no role selection, no admin option in the visible interface); sign-in happens on `/pages/login.html`
- The home page, catalogue, cart, checkout and account pages are **not accessible before login** (enforced by the server *and* client-side guards, with `?next=` return-to support)

### Customer
- **Login / registration** — **email-only login** (no password field — documented demo mode), registration collects name, email, phone and delivery address, back buttons to the welcome page, plain login always redirects to the **home page**
- **Home page** — hero banner (“Protect Your Crops. Grow Your Future.”), then **directly below the navbar** a horizontal **seven-category carousel** in the exact taxonomy order (Seeds / Crop Protection / Crop Nutrition / Equipments / Animal Husbandry / Organic / Tapas — arrows + mobile swipe, whole-card links, selected category highlighted), a **Seasonal Products** section fed by the admin-configurable seasonal flags (with per-product display notes, a clearly-labelled fallback when none are configured, and a friendly empty state), plus New Releases, Featured, Featured Seeds, Crop Protection, Recently Added and Farm Equipment rails, safe-farming guidance, demo reviews, FAQs, newsletter subscription
- **Category pages** (`/pages/category.html?type=…`) — one **heading section per taxonomy heading**, each with its own horizontal **subcategory carousel** in the exact order (Seeds 3 headings · 12 subcategories, Crop Protection 3 · 12, Crop Nutrition 3 · 11, Equipments 4 · 25, Animal Husbandry 2 · 7, Organic 2 · 6 — while **Tapas lists its 7 subcategories directly, with no heading sections**), where **every tile carries its own distinct illustration** (sourced from the single subcategory-tile mapping in `TAXONOMY`, lazy-loaded, consistent 110 px height, rounded corners, card-lift + zoom hover), then an **“Explore {Type}”** product section that is **shuffled fresh on every visit**, shows 12 initially and grows via *Load More* without ever repeating a product; clicking a tile filters the section **to that subcategory only** (`&sub=…`) with count + in-section search + price sorting; **any broken image falls back to a shared placeholder** (`/images/categories/image-fallback.svg`)
- **Product catalogue** — live search, main-category chips + subcategory dropdown, crop/price/availability filters, 7 sort options (+ “Recommended” which preserves the shuffled order), Load More pagination, empty states
- **Product cards** — image, name, **taxonomy chip (subcategory, heading or main category)**, **demo rating (★★★★☆ 4.2/5.0 — stable demo data, not customer reviews)**, pack size, price, **MRP + discount % when a genuine discount is configured**, live stock label (*In Stock / Low Stock / Out of Stock*), wishlist heart, details + add-to-cart buttons — one shared card component (`UI.productCard`) renders identically on every listing page
- **Product details** — image gallery with thumbnails + **click-to-zoom lightbox**, availability badge, **numeric demo rating explicitly labelled “demo rating”**, **breadcrumb Home / Products / main category / subcategory / name**, specs with **Main category + Category** rows, seed variety & sowing info, crop-protection label/safety blocks (clearly-marked demo data), batch/expiry, **“You May Also Like” horizontal carousel** (arrows + touch swipe, never includes the product itself), quantity picker, **Add to Cart / Buy Now / Wishlist**, back-to-products link
- **Out of stock handling** — highly visible “Out of Stock” panel with a “check back later” message, disabled Add to Cart & Buy Now, and the backend rejects orders for unavailable products (including products **manually blocked** by an administrator)
- **Wishlist** — dedicated page with live availability, remove and one-click *Move to Cart* (out-of-stock items stay listed but cannot move)
- **Cart** — persisted in `localStorage` across refreshes, quantity controls with stock caps, free-delivery progress bar, **live re-check of every line against the database** (unavailable items are clearly labelled and the single **Buy All** purchase button is disabled until the cart is purchasable; an empty cart shows a disabled Buy All)
- **Checkout** — two ways in: **Buy Now** on a product page opens an *express checkout* for just that product and quantity (`checkout.html?buy=<id>&qty=<n>`, cart untouched), while the cart's single **Buy All** button orders every available cart line together (the old *Proceed to Checkout* button is gone); address form with validation, Cash on Delivery + clearly-labelled demo payment, pre-submit availability check, server-side price/stock verification
- **Order Successful page** — dedicated confirmation with a **celebratory burst animation** (animated green checkmark + green/beige/white confetti, pop-in message, `prefers-reduced-motion` respected), heading **“Order Placed Successfully!”**, unique order id, **product count, highlighted total, ordered date and time, payment status**, item images/names/quantities/prices, delivery address, order status, and *View Order History* / *Continue Shopping* buttons; shown only after the backend really created the order (failures show an error instead)
- **Orders** — stored permanently in the database with **purchase-time snapshots** (name, price, image, pack size), My Orders history newest-first with **View Details** (opens the full receipt), status timeline, self-cancellation (Placed/Confirmed only) with automatic restock; **repeat submissions of the same checkout are collapsed into one order** via a per-page `clientRequestId` idempotency key
- **Account** — profile editing, saved address, logout; the navbar account menu links to Profile, Orders, Wishlist and Logout
- **Policies page** — shipping information, privacy policy and terms (`/pages/legal.html`), linked from the footer
- **Auth** — email-only register/login with field validation, JWT session (httpOnly cookie + bearer fallback)

### Admin (`/pages/admin-login.html` → `/pages/admin.html`)
- **Separate admin login — hidden from the visible interface** (no link from any page; reachable only by typing the URL directly); email only; only accounts with `role: admin` are accepted (verified on the backend against the database record — hiding the link never grants admin rights)
- **Dashboard Overview** — total products, active products, in-stock, out-of-stock, **newly released**, total orders, registered customers, revenue, low-stock alerts, monthly sales chart, top products, status split, recent orders
- **Manage Products** — full CRUD (create / edit / deactivate / permanent delete), includes inactive items, with *new* and *manually blocked* badges, per-product **demo rating**, **price-exemption badge** for owner-approved out-of-band prices, and an inline **“missing image”** badge when an image file no longer resolves; filter by **main category + subcategory** and live search
- **Add New Product** — form with name, **three-level taxonomy cascade: main category → heading → subcategory** (the heading list follows the chosen main category; the subcategory list follows the heading; **Tapas offers its own 7 subcategories directly with no heading step**), a **live price-band hint** for the chosen category with an **“Authorize out-of-range price”** checkbox (audited as `priceExempt`), description, brand, price, **MRP**, pack size, image + **additional images**, stock, **newly-released toggle + release date**, active status, **manual out-of-stock switch**, **seasonal flag + seasonal display note** (drives the home-page Seasonal Products section), crops, specifications, **label & safety information**, batch number & expiry
- **Edit Products & Prices** — quick inline price editing (uses the dedicated price endpoint; out-of-band values are rejected with the allowed range and can only be applied through an explicit confirm-to-override flow) plus full-edit modal
- **Newly Released Products** — flag/unflag any product as a new release; flagged products automatically appear in the customer home page section, newest first
- **Inventory Management** — quick per-product stock updates, visibility toggle and manual out-of-stock switch
- **Out-of-Stock Products** — shows *why* each product is unavailable (**quantity is zero** vs **manual block**), restocking (which clears the manual block), “Clear block” action, reason filter and search
- **Manage Orders** — status transitions + automatic restock on cancel
- **Manage Customers** — order counts and lifetime spend
- **Categories** — create / edit / delete, blocked while products use the category; stored **per main category** (unique on the `{name, type}` pair, 80 seeded subcategory documents with live per-pair product counts)

### Availability rule (single source of truth)

```
available  ⇔  active  AND  stockQuantity > 0  AND  manualOutOfStock = false
```

The database is authoritative: the same rule is applied by the backend for catalogue responses (`available` + `stockStatus` on every product), for the checkout validation and atomic stock decrement, and it drives every button/badge on the storefront.

### Security

> ### ⚠️ Security notice — email-only login is a low-security demo mode
> This build authenticates **by email address alone**. Knowing an email is
> the only check, so anyone who knows a registered address can sign in as
> that user — including administrator accounts. This simplified mode is for
> **local development and demonstration only**.
> - **Do not** deploy email-only login on a publicly accessible production site.
> - **Do not** protect real administrator accounts with it; privileged access must never depend solely on knowing an email address.
> - Before production, add real verification: a **one-time emailed code**, a **magic login link**, or **password authentication**. The `User.password` field (bcrypt hash) and `comparePassword()` are kept in the codebase so passwords can be re-enabled without a data migration.

Other protections in place:

- JWT signed with a server-side secret (`.env`, never exposed to the frontend), with expiry (`JWT_EXPIRES_IN`, default `7d`); logout clears the session cookie
- **Server-side login wall**: protected HTML pages redirect to the welcome page without a valid signed session; product/category APIs require authentication
- Role-based authorization middleware (`protect` + `requireAdmin`) on every admin route and the admin page itself — **the role always comes from the MongoDB record**, never from the request body or the login page used
- Registration always creates `role: customer` — no self-service admin signup; the admin account is only provisioned by `npm run create-admin`
- Rate limiting on auth endpoints (50 req/15 min, 20 sign-ups/hour)
- Helmet security headers, CORS allow-list, MongoDB operator sanitization
- Ownership checks: customers can only read/cancel **their own** orders
- All prices, delivery charges and totals recomputed on the server at checkout (browser totals are never trusted)
- Legacy accounts that still carry a bcrypt hash keep working — hashes are never stored or transmitted in plain text and are not re-hashed

---

## 🛠️ Tech stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, vanilla JavaScript (no frameworks) |
| Backend | Node.js + Express.js (REST API) |
| Database | MongoDB + Mongoose |
| Auth | JSONwebtoken (JWT in httpOnly cookie, bearer fallback) — email-only demo login; bcryptjs retained for legacy password hashes |
| Security | helmet, cors, express-rate-limit, mongo-sanitize |
| Images | Owner-supplied product photographs imported into `client/images/products/imported/` (585 real-brand pack-shots, `webp`/`avif`/`jpeg` + `jxl` rendered to PNG via Quick Look) + Wikimedia Commons photographs + generated SVG art (72 distinct subcategory-tile illustrations covering all 80 subcategory entries, 5 photo + 2 SVG main-category carousel cards, 55 demo pack-shots from `server/scripts/generateDemoArt.js`, plus a shared broken-image fallback) |

---

## 📁 Project structure

```
.
├── client/                     # static frontend (served by Express)
│   ├── index.html              # welcome/login entry page (site entry point)
│   ├── css/
│   │   ├── variables.css       # design tokens (forest green / beige palette)
│   │   ├── base.css            # reset, buttons, forms, utilities
│   │   ├── layout.css          # navbar, hero, footer, page headers
│   │   ├── components.css      # cards, cart, checkout, admin, toast, modal
│   │   └── entry.css           # welcome/login landing page
│   ├── js/
│   │   ├── api.js              # fetch wrapper + auth strategy
│   │   ├── store.js            # cart (localStorage) + auth cache
│   │   ├── taxonomy.js         # client mirror of the seven-category taxonomy (headings, subcategories, label helper)
│   │   ├── pricing.js          # client mirror of the category price bands (admin form hints)
│   │   ├── ui.js               # icons, toasts, navbar/footer, guards, shared product card + carousel helper
│   │   ├── entry.js            # entry page (?next= support)
│   │   ├── home.js  products.js  product-details.js  category.js
│   │   ├── cart.js  checkout.js  order-confirmation.js
│   │   └── auth.js  account.js  wishlist.js  admin.js
│   ├── images/                 # hero, categories, product + subcategory-tile images
│   └── pages/                  # home, category, products, details, cart, checkout,
│                               # wishlist, order-confirmation, login, register,
│                               # admin-login, account, admin, legal
│
├── server/                     # backend
│   ├── server.js               # app entry: security, login wall, static serving, routes
│   ├── config/db.js            # MongoDB connection
│   ├── models/                 # User, Product, Order, Category, Newsletter
│   ├── controllers/            # auth, product, order, user, admin, category
│   ├── routes/                 # modular Express routers
│   ├── middleware/             # auth (JWT), rate limits, cookies, errors
│   ├── utils/                  # ApiError, validators, token, delivery, orderId,
│   │                           # taxonomy.js (single source of truth: 7 main categories,
│   │                           # headings, subcategories, pair validation & canonicalization),
│   │                           # pricing.js (category price bands + demo rating band)
│   ├── data/
│   │   └── importedProducts.json  # 585 imported catalogue records (committed; read by the seed)
│   ├── scripts/
│   │   ├── seedProducts.js     # 110 demo + 585 imported products + 80 categories (idempotent, taxonomy-validated)
│   │   ├── importImages.js     # one-off: classify the owner's images/ folder → importedProducts.json + image copies
│   │   ├── validateCatalogue.js # checks images/taxonomy/prices/ratings/duplicates, reports orphans
│   │   ├── backupDb.js         # JSON safety dump of every collection → server/backups/
│   │   ├── migrateTaxonomy.js  # one-off: legacy type/category → primaryCategory/heading/subcategory
│   │   ├── checkTaxonomyParity.js  # fails if client/server taxonomies drift or art is missing
│   │   ├── generateDemoArt.js  # regenerates the pack-shots, subcategory tiles + main-category cards
│   │   ├── createAdmin.js      # bootstrap admin from .env
│   │   ├── fetchPhotos.js      # one-off: hero/category photos
│   │   └── fetchProductPhotos.js
│   ├── .env.example            # environment template
│   └── package.json
│
├── README.md
└── .gitignore
```

---

## 🚀 Getting started

### Prerequisites
- **Node.js** ≥ 18
- **MongoDB** running locally (`mongosh` ping should answer) **or** a MongoDB Atlas URI

### 1. Install dependencies

```bash
cd server
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Then edit `server/.env`:

| Variable | Description | Example |
|---|---|---|
| `PORT` | API + site port | `5050` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/agroshield` |
| `JWT_SECRET` | **Long random secret** (never commit) | `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `JWT_EXPIRES_IN` | Token lifetime | `7d` |
| `CLIENT_ORIGIN` | Comma-separated CORS allow-list | `http://127.0.0.1:5500,http://localhost:5500` |
| `NODE_ENV` | `development` or `production` | `development` |
| `ADMIN_EMAIL` / `ADMIN_NAME` (optional `ADMIN_PASSWORD`) | Bootstrap admin account (email-only login) | — |

> ⚠️ Port **5000** is occupied by macOS AirPlay on many Macs — that is why `5050` is the default.

### 3. Seed the database

```bash
npm run seed          # 110 demo + 585 imported catalogue products + 80 categories (safe to re-run, taxonomy-validated)
npm run create-admin  # creates the administrator from .env
```

Optional catalogue tooling:

```bash
npm run backup             # JSON safety dump of every collection → server/backups/<timestamp>/
npm run import-images      # re-run the one-off images/ → catalogue import (writes data/importedProducts.json)
npm run validate:catalogue # verify images, taxonomy, price bands, ratings, duplicates + orphan report
npm run check-taxonomy     # client/server taxonomy + price-band parity gate
```

### 4. Run

```bash
npm start             # production
npm run dev           # development (auto-restart on changes)
```

Open **http://localhost:5050** — you will land on the **welcome page**; click **Login** (register first if you need an account). The admin sign-in is not linked anywhere in the UI — it stays reachable only via `http://localhost:5050/pages/admin-login.html` (admin email below). Express serves both the API and the frontend.

**Live Server users:** `client/` can also be opened via VS Code Live Server (`:5500`/`:8080`/`:8000`); `api.js` automatically switches to `http://localhost:5050/api` and sends the JWT as a bearer token.

---

## 👤 Demo credentials

| Role | Email | How to sign in |
|---|---|---|
| Administrator | `admin@agroshield.in` | Hidden admin page `/pages/admin-login.html` (direct URL, not linked in the UI) — enter the email, click **Login** |
| Customer | register your own account | User Login page — enter your email, click **Login** |

> ⚠️ Email-only demo auth: anyone who knows an email can sign in as its owner. Change nothing here for local demos; implement OTP/magic-link/password login before any real deployment (see the security notice above).

---

## 🔌 API reference

Base URL: `http://localhost:5050/api`

### Auth
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | — | Create customer account from `name`, `email`, `phone`, `address` — no password (rate-limited; always `role: customer`) |
| POST | `/auth/login` | — | **Email-only**: `{ email }` (+ optional `loginAs: 'admin'` which only restricts, never grants, admin access); 404 for an unregistered email, 403 for a role mismatch (rate-limited) |
| GET | `/auth/me` | user | Current user profile |
| POST | `/auth/logout` | — | Clear session cookie |

### Catalogue
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/products` | user | List — supports `search, type, category, subcategory, crop, minPrice, maxPrice, inStock, featured, bestseller, seasonal, newRelease, shuffle, sort (incl. `release`), page, limit`; `type` matches a product's **primary or additional** category and a `{type, category}` pair is validated against the store taxonomy (impossible combinations → 400). Every item carries `available`, `stockStatus` and `discountPercent`. `shuffle=true` returns a fresh random sample (no duplicates) for the “Explore” sections |
| GET | `/products/seasonal` | user | Products flagged `isSeasonal` with their display notes; when none are configured it falls back to popular picks and sets `demoFallback: true` so the UI can label them clearly |
| GET | `/products/new-releases` | user | Products flagged as newly released, newest (`releaseDate`) first — powers the home page section |
| GET | `/products/:id` | user | Detail (+ related products) — 404 for inactive products |
| GET | `/products/:id/related` | user | “Related Products” carousel set (same subcategory first, top-up from other actives of the same main category, never includes itself) |
| POST | `/products` | admin | Create product (name → auto slug, `primaryCategory` + `subcategory` **validated as a legal taxonomy pair** — legacy `type`/`category` names accepted as aliases, `heading` derived from the taxonomy, `additionalCategories[]` for cross-listing, `mrp`, `images[]`, `isNewRelease`, `releaseDate`, `manualOutOfStock`, `isSeasonal`, `seasonalNote`, …). **Price must fall in the category band** (see below) unless `allowOutOfRangePrice: true` is sent — an authorized override that stamps `priceExempt` |
| PATCH | `/products/:id` | admin | Update product (partial updates re-validate the stored primary category / heading / subcategory trio; a supplied price is band-checked the same way) |
| DELETE | `/products/:id` | admin | Deactivate (`?permanent=true` to delete) |
| GET | `/categories` | user | Categories with live product counts |
| POST | `/newsletter` | — | Subscribe |

### Wishlist
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/wishlist` | user | Saved products with live availability (`available`, `stockStatus`, `discountPercent`) — alias of `/users/wishlist` |
| POST / DELETE | `/wishlist/:productId` | user | Add / remove (no duplicates) |

### Orders (customer)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/orders` | user | Checkout — server verifies prices/stock/availability (incl. manual blocks), computes totals, decrements inventory atomically |
| GET | `/orders/my` | user | Own orders only |
| GET | `/orders/:id` | owner/admin | Readable order id (`AS-YYYYMMDD-XXXXXX`) |
| PATCH | `/orders/:id/cancel` | owner | Cancel while Placed/Confirmed + restock |

### Account
| Method | Endpoint | Auth |
|---|---|---|
| GET / PATCH | `/users/profile` | user |
| GET / POST / DELETE | `/users/wishlist[/:productId]` | user |

### Admin (all require `role: admin`)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/admin/dashboard` | Stats (total/active/in-stock/out-of-stock/newly-released products, orders, customers, revenue), sales chart, low stock, top products, recent orders |
| GET | `/admin/products` | Product list **including inactive items** — `status=active|inactive|instock|outofstock|newrelease`, `search`, `category`/`subcategory` (validated against the taxonomy), `page`, `limit` |
| GET | `/admin/products/:id` | Full product record **including inactive items** (used by the edit form) |
| GET | `/admin/products/out-of-stock` | Products that are unavailable — `reason=manual|quantity`, `search`, `page` |
| POST | `/admin/products` | Create product (alias of `POST /products`) |
| PATCH | `/admin/products/:id` | Update product (alias of `PATCH /products/:id`) |
| PATCH | `/admin/products/:id/price` | Change selling price and/or MRP — out-of-band prices return **400 with the allowed range** unless `allowOutOfRangePrice: true` (audited as `priceExempt`) |
| PATCH | `/admin/products/:id/stock` | Set stock; `clearManualOutOfStock: true` restores availability when active + qty > 0 |
| PATCH | `/admin/products/:id/availability` | Toggle `active`, `manualOutOfStock` and/or `isNewRelease` (+ `releaseDate`) |
| DELETE | `/admin/products/:id` | Deactivate / permanently delete |
| GET | `/admin/orders` | All orders with search/status filter + pagination |
| PATCH | `/admin/orders/:id` | Update order/payment status (restocks on cancel) |
| GET | `/admin/customers` | Customers with order counts and spend |
| GET/POST/PATCH/DELETE | `/admin/categories` | Category management (one document per `{name, type}` pair, per-pair product counts) |

**Response shape:** success → `{ success: true, ... }` · failure → `{ success: false, message }`

---

## ✅ Testing checklist

Verified against a running instance (see §15 of the project prompt):

- [x] Registration: valid data without any password field, duplicate email (409), invalid phone/PIN rejected
- [x] Email-only login: registered email succeeds, unregistered email rejected with a clear 404 message (no stack traces), invalid email format → 400, missing auth (401)
- [x] Welcome/login page is the site entry (no role selection, no admin option in the visible UI); protected pages redirect to `/?next=…` when logged out
- [x] Admin login: by email; customer email rejected on the admin page (403); admin email rejected on the user login page (403); customers blocked from `/pages/admin.html` and all admin APIs
- [x] Sessions expire (JWT `exp`) — an expired token gets 401; logout clears the cookie so the session is invalid immediately
- [x] Product/category APIs return 401 without a valid session
- [x] Product data loaded from MongoDB (695 active products — 110 labelled demo + 585 imported real-brand listings — 80 subcategory documents)
- [x] Search / main-category chip / subcategory / price / stock / crop filters, all 7 sort orders, empty state, pagination
- [x] Out-of-stock: badge + disabled Add to Cart/Buy Now in the UI, backend rejects checkout for unavailable stock with a clear message
- [x] Cart quantity updates, stock caps, subtotal/delivery/total math
- [x] Checkout: server-side price recomputation, stock validation, failed-order stock rollback, atomic decrement (no overselling)
- [x] Customers **cannot** read other customers' orders (403) or anonymous requests (401)
- [x] Ordinary users **cannot** reach admin endpoints (403)
- [x] Admin: dashboard in/out-of-stock + user counts, product create/edit/deactivate/delete, inventory stock updates, out-of-stock list, category CRUD (delete blocked while in use), order status updates (invalid statuses rejected)
- [x] Order cancellation restores stock; cancelled orders excluded from revenue
- [x] Empty states, loading spinners, API error messages on every page
- [x] Responsive layouts at desktop / tablet / mobile breakpoints
- [x] Profile update, wishlist sync
- [x] Home page New Releases section shows the flagged database products (newest first) with an empty state when none are flagged
- [x] Product cards/details show MRP + discount % only when a genuine discount (mrp > price) exists
- [x] PDP gallery thumbnails + zoom lightbox; related carousel excludes the current product and shows ≥ 8 real database items
- [x] Wishlist page: list, remove, move-to-cart (blocked for out-of-stock), availability always live
- [x] Cart re-checks every line on load — unavailable items labelled, quantities capped, **Buy All blocked** until the cart is purchasable (empty cart → disabled Buy All)
- [x] Checkout pre-verifies availability and blocks the Place Order button while issues remain
- [x] Admin: manually mark a product out of stock → customers immediately see *Out of Stock* (even with stock > 0), Add to Cart/Buy Now disabled, **API checkout rejected with a clear message**
- [x] Admin: restock (clears the manual block) → product becomes purchasable again only when active + qty > 0
- [x] Admin: price changes appear immediately on product cards, details, related carousel and cart summary (cart lines re-priced from the database)
- [x] Admin: new-release flag toggles instantly feed the customer home page section
- [x] Admin: inactive products stay hidden from customers but remain editable in the dashboard (admin detail endpoint)
- [x] Out-of-stock management: reason filter (manual vs quantity), search, restock, clear-block actions
- [x] Shipping / Privacy / Terms page public at `/pages/legal.html`, linked from the footer
- [x] Home page main-category carousel: **7 cards in the exact taxonomy order**, sitting directly below the navbar, arrows + swipe, whole-card links
- [x] Home page Seasonal Products section: live seasonal products with display notes; fallback clearly labelled when none configured; empty state; out-of-stock seasonal items not purchasable
- [x] Category pages: **heading sections with subcategory carousels in the exact taxonomy order** — Seeds 3/12, Crop Protection 3/12, Crop Nutrition 3/11, Equipments 4/25, Animal Husbandry 2/7, Organic 2/6; **Tapas lists its 7 subcategories directly (no headings)**
- [x] “Explore {Type}” sections shuffled per visit (12 initially, Load More without duplicates), active-only and main-category-pure
- [x] Subcategory views: **filter to that subcategory only** + count + in-section search + price sorting; cross-listed products (`additionalCategories`) appear under each of their main categories from a single canonical record
- [x] Backend rejects impossible main-category/heading/subcategory combinations (create, partial update and listing all return 400)
- [x] Admin product form: **three-level cascade (main category → heading → subcategory)**; Tapas offers its own 7 subcategories directly; seasonal flag + display note editable and pre-filled on edit; admin product/inventory search and filters work against the new taxonomy
- [x] Navbar + footer Shop column list exactly the seven main categories; no retired category label (“Pesticides”, “Farming Essentials”, standalone “Fertilizers”) rendered as a category label or deep link
- [x] Full **15-point** browser acceptance suite (headless Chrome + CDP): **119/119 checks** across the carousel, nav/footer, the exact heading/subcategory structure of all seven category pages, art loading, sub filtering + removed-category rejection, catalogue search/sort/filters, card chips + **demo-rating display**, the admin cascade + save round-trip + **price-band rejection/override/clear**, the out-of-stock flow, PDP breadcrumbs/specs/related/label panel + **demo-rating label**, a 375px mobile pass, page/API count parity (at 695 products), the **Buy Now express checkout + Order Successful page + order history** flow (idempotency, stock round-trip, success-page details, confetti burst, single Buy All cart button) and the **login flow** (single login card, no admin option in the visible UI, no “User” wording, home-page redirect, logout)
- [x] Demo ratings: every active product carries a stable 3.5–4.5 rating in 0.1 steps, rendered as stars + numeric text on cards, PDP (labelled “demo rating”) and related-product cards
- [x] Category price bands enforced server-side on create/edit and the quick-price editor (400 with the allowed range; explicit `allowOutOfRangePrice` override stamps the audited `priceExempt` flag); the 93 legacy out-of-band demo prices are kept as owner-approved exemptions
- [x] `npm run validate:catalogue` green: every image path resolves to a real local file, every product has a valid taxonomy pair, all active prices in-band or exempt, all ratings in 3.5–4.5, no duplicate slugs/names, orphan imported images reported (none), orders/users untouched
- [x] Subcategory imagery: all 80 subcategory entries render their own tile illustration (72 distinct files — shared only where the same subcategory name legitimately exists under two main categories) with alt text and lazy loading; clicking every tile opens the correct sub view with the correct products
- [x] Every main-category card and subcategory tile has relevant demo art with a descriptive filename; the home carousel works at desktop and mobile widths (mobile: burger nav, swipeable track, no horizontal page overflow)
- [x] Broken-image fallback: a global capture-phase handler swaps any failed `<img>` once for `/images/categories/image-fallback.svg`, preserving alt text and guarding against swap loops

---

## 🗄️ Database design

**User** — name, email (unique), phone, optional password hash (bcrypt, `select:false` — kept for legacy accounts / a future return to password auth; unused by email-only demo login), role (`customer|admin`), saved address, wishlist, timestamps

**Product** — name, slug, description, **primaryCategory (one of the seven main categories)**, **heading (derived from the taxonomy; empty for Tapas)**, **subcategory (validated as a legal `{primaryCategory, heading, subcategory}` combination against `server/utils/taxonomy.js`)**, **additionalCategories[] (extra main categories the product is also listed under — the single canonical record for the Organic overlap)**, brand, price, **mrp** (original price — discount shown only when mrp > price), packSize, image + images[], stockQuantity, **manualOutOfStock**, **isNewRelease** + **releaseDate**, **isSeasonal** + **seasonalNote** (home-page Seasonal Products section), crops[], seedInfo{}, labelInfo{}, specifications[], batch{}, **rating** (stable demo rating 3.5–4.5) + reviewCount, **priceExempt** (audited out-of-band price exception), demo/active/featured/bestseller flags, timestamps + indexes (incl. `active + isNewRelease + releaseDate`)

**Order** — unique readable `orderId`, user ref, item snapshots (name/price/packSize/image/quantity at purchase time), address snapshot, subtotal, delivery, total, payment method/status, order status (`Placed → Confirmed → Processing → Shipped → Delivered | Cancelled`), status history, **`clientRequestId` (per-page idempotency key with a partial unique index — repeat submissions collapse into the first order)**, timestamps + indexes

**Category** — name + type as a **compound unique key (`{name, type}`)** — the same subcategory name may exist under two main categories (80 documents), image, description, active

**Newsletter** — email (unique), timestamps

---

## 🌐 Real catalogue import (images → prices → ratings)

The owner's `images/` photo dump (872 files across ~75 subcategory-named folders) is imported into the catalogue by **`npm run import-images`** (`server/scripts/importImages.js`):

1. **Inventory + de-duplication** — every file is hashed; identical copies across folders collapse into one product (283 merges: e.g. the same yellow-trap photo stored in three folders), and same-name listings inside one main category merge into a single canonical record (the webp/jpeg original wins over a converted copy).
2. **Classification** — a folder → taxonomy map covers the specific folders; mixed folders (“crop protection”, “traps and lures”, “Mulch”…) are classified per file name (bio-before-chemical keyword rules); `| TAPAS`-tagged listings are routed to the Tapas storefront. Every mapping is validated against `server/utils/taxonomy.js` — anything ambiguous lands in the **unmatched report** instead of being guessed (4 files: 3 extension-less names + a leaf blower that fits no subcategory).
3. **Image handling** — originals in `images/` are never moved, renamed or deleted; curated copies are written to `client/images/products/imported/` (webp/avif/jpeg pass through; the 17 browser-unsupported **JPEG XL** files are rendered to PNG via macOS Quick Look).
4. **Deterministic demo values** — each record gets a whole-rupee price **inside its primary category's band**, an occasional MRP, a stock level and a 3.5–4.5 rating derived from a hash of the product identity, so re-runs never change the data. The generated `server/data/importedProducts.json` is committed and `npm run seed` upserts it by import slug — the import is fully reproducible without the source folder.

### Category price bands (INR, enforced server-side)

| Main category | Minimum | Maximum |
|---|---:|---:|
| Seeds | ₹500 | ₹2,000 |
| Crop Nutrition | ₹500 | ₹1,000 |
| Crop Protection | ₹500 | ₹1,500 |
| Equipments | ₹1,500 | ₹5,000 |
| Animal Husbandry | ₹1,000 | ₹3,500 |
| Organic | ₹500 | ₹1,500 |
| Tapas | ₹500 | ₹2,000 |

Source of truth: `server/utils/pricing.js` (client mirror `client/js/pricing.js`, parity-checked). Every API-saved price must fall inside the band of the product's **primary** category; the explicit `allowOutOfRangePrice` override is the only way out and is audited as `priceExempt`. The **93 legacy demo prices** that sit outside a band (e.g. the ₹18,999 demo milking machine) were deliberately kept by the owner and are flagged `priceExempt`, so the validator reports them as known exceptions instead of failures. Cross-listed products price from their primary category — the import reports any conflict with an additional category's band (currently zero).

### Demo ratings

Every active product carries a **stable demo rating between 3.5 and 4.5 (0.1 steps)** — the 110 demo products were normalised into the band, the imported catalogue derives ratings deterministically. Ratings are rendered as star glyphs + numeric text (`★★★★☆ 4.2/5.0`) on cards, the PDP (explicitly labelled **“demo rating”**) and related-product cards. No review counts are fabricated, and demo ratings are never presented as verified customer feedback.

### Validation & safety

- **`npm run validate:catalogue`** — verifies every image path resolves to a real local file, every product has a legal taxonomy pair, every active price is in-band or exempt, every rating is in 3.5–4.5, slugs/name+brand keys are unique (duplicate detection), orphan imported images are reported (never auto-deleted), and orders/users are untouched (counted and totalled).
- **`npm run backup`** — JSON dump of every collection to `server/backups/<timestamp>/` (git-ignored) was taken before the import; the migration itself is non-destructive upserts only — historical order snapshots and totals are never rewritten.

---

## 🌾 Demo data & legal notice

- Every crop-protection and other catalogue listing is **clearly marked as demo data** (`isDemoData: true`, “(Demo)” in the name, amber badges, warning banners on product pages).
- Label, composition and registration fields are **placeholders**, not invented dosages or certifications.
- Before any real sale: verify **Indian Insecticides Act registration** for regulated crop-protection products, seller licensing, and display genuine product label/safety information.

## 📸 Image credits

Real product pack-shots are the **shop owner's own catalogue photographs**, imported from the local `images/` folder into `client/images/products/imported/` (the originals stay untouched and untracked). Hero/category photographs are sourced from **Wikimedia Commons** (CC BY-SA / public domain) via `server/scripts/fetchPhotos.js` and `fetchProductPhotos.js`. Demo product pack-shot SVGs are generated locally.

---

## 🔜 Possible next steps

- Payment gateway integration (Razorpay/UPI) replacing the demo checkout
- Email/SMS order notifications
- Replace the stable demo ratings with real customer reviews (ratings are currently labelled demo data everywhere)
- Image uploads for admin product management
- Dockerised deployment (MongoDB + API + static hosting)
