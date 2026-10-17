# 🌱 AgroShield — Pesticides & Seeds E-Commerce Platform

A complete, responsive **full-stack agricultural e-commerce website** built with the **MERN-style stack** (Express + MongoDB + vanilla HTML/CSS/JS). AgroShield is an online marketplace for farmers, gardeners and agricultural customers to shop for seeds, pesticides, fertilizers and farming essentials.

> **Internship demo project.** All brands, prices and pesticide label data are clearly labelled demonstration data. See [Demo data & legal notice](#-demo-data--legal-notice) before any real-world use.

---

## ✨ Features

### Login selection (entry page)
- **`/` is a login selection page** — visitors choose *Login as Admin* or *Login as User* before anything else
- The home page, catalogue, cart, checkout and account pages are **not accessible before login** (enforced by the server *and* client-side guards, with `?next=` return-to support)

### Customer
- **User login / registration** — **email-only login** (no password field), registration collects name, email, phone and delivery address, back buttons to the selection page
- **Home page** — hero banner (“Protect Your Crops. Grow Your Future.”), shop-by-category cards, **Newly Released Products** (live from the database, newest first, with an empty state), Featured, Featured Seeds, Crop Protection, Recently Added and Farming Essentials rails, safe-farming guidance, demo reviews, FAQs, newsletter subscription
- **Product catalogue** — live search, category/crop/price/availability filters, 7 sort options, Load More pagination, empty states
- **Product cards** — image, name, category, pack size, price, **MRP + discount % when a genuine discount is configured**, live stock label (*In Stock / Low Stock / Out of Stock*), wishlist heart, details + add-to-cart buttons
- **Product details** — image gallery with thumbnails + **click-to-zoom lightbox**, availability badge, specs, seed variety & sowing info, pesticide label/safety blocks, batch/expiry, **“You May Also Like” horizontal carousel** (arrows + touch swipe, never includes the product itself), quantity picker, **Add to Cart / Buy Now / Wishlist**, back-to-products link
- **Out of stock handling** — highly visible “Out of Stock” panel with a “check back later” message, disabled Add to Cart & Buy Now, and the backend rejects orders for unavailable products (including products **manually blocked** by an administrator)
- **Wishlist** — dedicated page with live availability, remove and one-click *Move to Cart* (out-of-stock items stay listed but cannot move)
- **Cart** — persisted in `localStorage` across refreshes, quantity controls with stock caps, free-delivery progress bar, **live re-check of every line against the database** (unavailable items are clearly labelled and **checkout is blocked** until the cart is purchasable)
- **Checkout** — address form with validation, Cash on Delivery + clearly-labelled demo payment, pre-submit availability check, server-side price/stock verification
- **Orders** — confirmation page, My Orders with status timeline, self-cancellation (Placed/Confirmed only) with automatic restock
- **Account** — profile editing, saved address, logout; the navbar account menu links to Profile, Orders, Wishlist and Logout
- **Policies page** — shipping information, privacy policy and terms (`/pages/legal.html`), linked from the footer
- **Auth** — email-only register/login with field validation, JWT session (httpOnly cookie + bearer fallback)

### Admin (`/pages/admin-login.html` → `/pages/admin.html`)
- **Separate admin login** — email only; only accounts with `role: admin` are accepted (verified on the backend against the database record)
- **Dashboard Overview** — total products, active products, in-stock, out-of-stock, **newly released**, total orders, registered customers, revenue, low-stock alerts, monthly sales chart, top products, status split, recent orders
- **Manage Products** — full CRUD (create / edit / deactivate / permanent delete), includes inactive items, with *new* and *manually blocked* badges
- **Add New Product** — form with name, category, description, brand, price, **MRP**, pack size, image + **additional images**, stock, **newly-released toggle + release date**, active status, **manual out-of-stock switch**, crops, specifications, **label & safety information**, batch number & expiry
- **Edit Products & Prices** — quick inline price editing (uses the dedicated price endpoint) plus full-edit modal
- **Newly Released Products** — flag/unflag any product as a new release; flagged products automatically appear in the customer home page section, newest first
- **Inventory Management** — quick per-product stock updates, visibility toggle and manual out-of-stock switch
- **Out-of-Stock Products** — shows *why* each product is unavailable (**quantity is zero** vs **manual block**), restocking (which clears the manual block), “Clear block” action, reason filter and search
- **Manage Orders** — status transitions + automatic restock on cancel
- **Manage Customers** — order counts and lifetime spend
- **Categories** — create / edit / delete, blocked while products use the category

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
- **Server-side login wall**: protected HTML pages redirect to the selection page without a valid signed session; product/category APIs require authentication
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
| Images | Wikimedia Commons photographs + generated SVG pack-shots |

---

## 📁 Project structure

```
.
├── client/                     # static frontend (served by Express)
│   ├── index.html              # login selection page (site entry point)
│   ├── css/
│   │   ├── variables.css       # design tokens (forest green / beige palette)
│   │   ├── base.css            # reset, buttons, forms, utilities
│   │   ├── layout.css          # navbar, hero, footer, page headers
│   │   ├── components.css      # cards, cart, checkout, admin, toast, modal
│   │   └── entry.css           # login selection landing page
│   ├── js/
│   │   ├── api.js              # fetch wrapper + auth strategy
│   │   ├── store.js            # cart (localStorage) + auth cache
│   │   ├── ui.js               # icons, toasts, navbar (account menu)/footer, guards
│   │   ├── entry.js            # selection page (?next= support)
│   │   ├── home.js  products.js  product-details.js
│   │   ├── cart.js  checkout.js  order-confirmation.js
│   │   └── auth.js  account.js  wishlist.js  admin.js
│   ├── images/                 # hero, categories, product images
│   └── pages/                  # home, products, details, cart, checkout,
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
│   ├── utils/                  # ApiError, validators, token, delivery, orderId
│   ├── scripts/
│   │   ├── seedProducts.js     # 34 demo products + 9 categories (idempotent)
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
npm run seed          # 34 demo products + 9 categories (safe to re-run)
npm run create-admin  # creates the administrator from .env
```

### 4. Run

```bash
npm start             # production
npm run dev           # development (auto-restart on changes)
```

Open **http://localhost:5050** — you will land on the **login selection page**; choose *Login as User* (register first) or *Login as Admin* (admin email below). Express serves both the API and the frontend.

**Live Server users:** `client/` can also be opened via VS Code Live Server (`:5500`/`:8080`/`:8000`); `api.js` automatically switches to `http://localhost:5050/api` and sends the JWT as a bearer token.

---

## 👤 Demo credentials

| Role | Email | How to sign in |
|---|---|---|
| Administrator | `admin@agroshield.in` | Admin Login page — enter the email, click **Login** |
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
| GET | `/products` | user | List — supports `search, type, category, crop, minPrice, maxPrice, inStock, featured, bestseller, seasonal, newRelease, sort (incl. `release`), page, limit`; every item carries `available`, `stockStatus` and `discountPercent` |
| GET | `/products/new-releases` | user | Products flagged as newly released, newest (`releaseDate`) first — powers the home page section |
| GET | `/products/:id` | user | Detail (+ related products) — 404 for inactive products |
| GET | `/products/:id/related` | user | “You May Also Like” carousel set (same category first, top-up from other actives, never includes itself) |
| POST | `/products` | admin | Create product (name → auto slug, `mrp`, `images[]`, `isNewRelease`, `releaseDate`, `manualOutOfStock`, …) |
| PATCH | `/products/:id` | admin | Update product |
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
| GET | `/admin/products` | Product list **including inactive items** — `status=active|inactive|instock|outofstock|newrelease`, `search`, `category`, `page`, `limit` |
| GET | `/admin/products/:id` | Full product record **including inactive items** (used by the edit form) |
| GET | `/admin/products/out-of-stock` | Products that are unavailable — `reason=manual|quantity`, `search`, `page` |
| POST | `/admin/products` | Create product (alias of `POST /products`) |
| PATCH | `/admin/products/:id` | Update product (alias of `PATCH /products/:id`) |
| PATCH | `/admin/products/:id/price` | Change selling price and/or MRP |
| PATCH | `/admin/products/:id/stock` | Set stock; `clearManualOutOfStock: true` restores availability when active + qty > 0 |
| PATCH | `/admin/products/:id/availability` | Toggle `active`, `manualOutOfStock` and/or `isNewRelease` (+ `releaseDate`) |
| DELETE | `/admin/products/:id` | Deactivate / permanently delete |
| GET | `/admin/orders` | All orders with search/status filter + pagination |
| PATCH | `/admin/orders/:id` | Update order/payment status (restocks on cancel) |
| GET | `/admin/customers` | Customers with order counts and spend |
| GET/POST/PATCH/DELETE | `/admin/categories` | Category management |

**Response shape:** success → `{ success: true, ... }` · failure → `{ success: false, message }`

---

## ✅ Testing checklist

Verified against a running instance (see §15 of the project prompt):

- [x] Registration: valid data without any password field, duplicate email (409), invalid phone/PIN rejected
- [x] Email-only login: registered email succeeds, unregistered email rejected with a clear 404 message (no stack traces), invalid email format → 400, missing auth (401)
- [x] Login selection page is the site entry; protected pages redirect to `/?next=…` when logged out
- [x] Admin login: by email; customer email rejected on the admin page (403); admin email rejected on the user login page (403); customers blocked from `/pages/admin.html` and all admin APIs
- [x] Sessions expire (JWT `exp`) — an expired token gets 401; logout clears the cookie so the session is invalid immediately
- [x] Product/category APIs return 401 without a valid session
- [x] Product data loaded from MongoDB (34 products, 9 categories)
- [x] Search / category / price / stock / crop filters, all 7 sort orders, empty state, pagination
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
- [x] Cart re-checks every line on load — unavailable items labelled, quantities capped, **Proceed to Checkout blocked** until the cart is purchasable
- [x] Checkout pre-verifies availability and blocks the Place Order button while issues remain
- [x] Admin: manually mark a product out of stock → customers immediately see *Out of Stock* (even with stock > 0), Add to Cart/Buy Now disabled, **API checkout rejected with a clear message**
- [x] Admin: restock (clears the manual block) → product becomes purchasable again only when active + qty > 0
- [x] Admin: price changes appear immediately on product cards, details, related carousel and cart summary (cart lines re-priced from the database)
- [x] Admin: new-release flag toggles instantly feed the customer home page section
- [x] Admin: inactive products stay hidden from customers but remain editable in the dashboard (admin detail endpoint)
- [x] Out-of-stock management: reason filter (manual vs quantity), search, restock, clear-block actions
- [x] Shipping / Privacy / Terms page public at `/pages/legal.html`, linked from the footer

---

## 🗄️ Database design

**User** — name, email (unique), phone, optional password hash (bcrypt, `select:false` — kept for legacy accounts / a future return to password auth; unused by email-only demo login), role (`customer|admin`), saved address, wishlist, timestamps

**Product** — name, slug, description, category, type, brand, price, **mrp** (original price — discount shown only when mrp > price), packSize, image + images[], stockQuantity, **manualOutOfStock**, **isNewRelease** + **releaseDate**, crops[], seedInfo{}, labelInfo{}, specifications[], batch{}, demo/active/featured/bestseller/seasonal flags, timestamps + indexes (incl. `active + isNewRelease + releaseDate`)

**Order** — unique readable `orderId`, user ref, item snapshots (name/price/packSize/image/quantity at purchase time), address snapshot, subtotal, delivery, total, payment method/status, order status (`Placed → Confirmed → Processing → Shipped → Delivered | Cancelled`), status history, timestamps + indexes

**Category** — name (unique), type, image, description, active

**Newsletter** — email (unique), timestamps

---

## 🌾 Demo data & legal notice

- Every pesticide listing is **clearly marked as demo data** (`isDemoData: true`, “(Demo)” in the name, amber badges, warning banners on product pages).
- Label, composition and registration fields are **placeholders**, not invented dosages or certifications.
- Before any real sale: verify **Indian Insecticides Act registration**, seller licensing, and display genuine product label/safety information.

## 📸 Image credits

Photographs are sourced from **Wikimedia Commons** (CC BY-SA / public domain) via `server/scripts/fetchPhotos.js` and `fetchProductPhotos.js`. Product pack-shot SVGs are generated locally.

---

## 🔜 Possible next steps

- Payment gateway integration (Razorpay/UPI) replacing the demo checkout
- Email/SMS order notifications
- Product reviews & ratings from real customers
- Image uploads for admin product management
- Dockerised deployment (MongoDB + API + static hosting)
