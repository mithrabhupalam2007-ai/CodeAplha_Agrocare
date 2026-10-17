# 🌱 AgroShield — Pesticides & Seeds E-Commerce Platform

A complete, responsive **full-stack agricultural e-commerce website** built with the **MERN-style stack** (Express + MongoDB + vanilla HTML/CSS/JS). AgroShield is an online marketplace for farmers, gardeners and agricultural customers to shop for seeds, pesticides, fertilizers and farming essentials.

> **Internship demo project.** All brands, prices and pesticide label data are clearly labelled demonstration data. See [Demo data & legal notice](#-demo-data--legal-notice) before any real-world use.

---

## ✨ Features

### Customer
- **Home page** — hero banner, shop-by-category cards, featured/bestseller/seasonal product rails, safe-farming guidance, demo reviews, FAQs, newsletter subscription
- **Product catalogue** — live search, category/crop/price/availability filters, 7 sort options, Load More pagination, empty states
- **Product details** — specs, seed variety & sowing info, pesticide label/safety blocks, batch/expiry, related products, quantity picker
- **Cart** — persisted in `localStorage` across refreshes, quantity controls with stock caps, free-delivery progress bar
- **Checkout** — address form with validation, Cash on Delivery + clearly-labelled demo payment, server-side price/stock verification
- **Orders** — confirmation page, My Orders with status timeline, self-cancellation (Placed/Confirmed only) with automatic restock
- **Account** — profile editing, saved address, wishlist, change password, logout
- **Auth** — register/login with field validation, bcrypt hashing, JWT (httpOnly cookie + bearer fallback)

### Admin (`/pages/admin.html`)
- Dashboard: revenue, orders, customers, low-stock alerts, monthly sales chart, top products, status split, recent orders
- Product CRUD (create / edit / deactivate / permanent delete)
- Order management with status transitions + automatic restock on cancel
- Customer list with order counts and lifetime spend
- Category management (create / edit / delete, blocked while products use the category)

### Security
- bcrypt password hashing (cost 10) — plain-text passwords never stored
- JWT signed with a server-side secret (`.env`, never exposed to the frontend)
- Role-based authorization middleware (`protect` + `requireAdmin`) on every admin route
- Registration always creates `role: customer` — no self-service admin signup
- Rate limiting on auth endpoints (50 req/15 min, 20 sign-ups/hour)
- Helmet security headers, CORS allow-list, MongoDB operator sanitization
- Ownership checks: customers can only read/cancel **their own** orders
- All prices, delivery charges and totals recomputed on the server at checkout (browser totals are never trusted)

---

## 🛠️ Tech stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, vanilla JavaScript (no frameworks) |
| Backend | Node.js + Express.js (REST API) |
| Database | MongoDB + Mongoose |
| Auth | bcryptjs + JSONwebtoken (JWT in httpOnly cookie, bearer fallback) |
| Security | helmet, cors, express-rate-limit, mongo-sanitize |
| Images | Wikimedia Commons photographs + generated SVG pack-shots |

---

## 📁 Project structure

```
.
├── client/                     # static frontend (served by Express)
│   ├── index.html              # home page
│   ├── css/
│   │   ├── variables.css       # design tokens (forest green / beige palette)
│   │   ├── base.css            # reset, buttons, forms, utilities
│   │   ├── layout.css          # navbar, hero, footer, page headers
│   │   └── components.css      # cards, cart, checkout, admin, toast, modal
│   ├── js/
│   │   ├── api.js              # fetch wrapper + auth strategy
│   │   ├── store.js            # cart (localStorage) + auth cache
│   │   ├── ui.js               # icons, toasts, navbar/footer, guards
│   │   ├── home.js  products.js  product-details.js
│   │   ├── cart.js  checkout.js  order-confirmation.js
│   │   └── auth.js  account.js   admin.js
│   ├── images/                 # hero, categories, product images
│   └── pages/                  # products, details, cart, checkout, auth, account, admin
│
├── server/                     # backend
│   ├── server.js               # app entry: security, static serving, routes
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
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Bootstrap admin credentials | — |

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

Open **http://localhost:5050** — Express serves both the API and the frontend.

**Live Server users:** `client/` can also be opened via VS Code Live Server (`:5500`/`:8080`/`:8000`); `api.js` automatically switches to `http://localhost:5050/api` and sends the JWT as a bearer token.

---

## 👤 Demo credentials

| Role | Email | Password |
|---|---|---|
| Administrator | `admin@agroshield.in` | `Admin@1234` |
| Customer | register your own account | — |

> Change `ADMIN_PASSWORD` in `.env` and re-run `npm run create-admin` for anything beyond local demos.

---

## 🔌 API reference

Base URL: `http://localhost:5050/api`

### Auth
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | — | Create customer account (rate-limited) |
| POST | `/auth/login` | — | Get JWT + httpOnly cookie (rate-limited) |
| GET | `/auth/me` | user | Current user profile |
| POST | `/auth/logout` | — | Clear session cookie |

### Catalogue
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/products` | — | List — supports `search, type, category, crop, minPrice, maxPrice, inStock, featured, bestseller, seasonal, sort, page, limit` |
| GET | `/products/:id` | — | Detail + related products |
| POST | `/products` | admin | Create product |
| PATCH | `/products/:id` | admin | Update product |
| DELETE | `/products/:id` | admin | Deactivate (`?permanent=true` to delete) |
| GET | `/categories` | — | Categories with live product counts |
| POST | `/newsletter` | — | Subscribe |

### Orders (customer)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/orders` | user | Checkout — server verifies prices/stock, computes totals, decrements inventory atomically |
| GET | `/orders/my` | user | Own orders only |
| GET | `/orders/:id` | owner/admin | Readable order id (`AS-YYYYMMDD-XXXXXX`) |
| PATCH | `/orders/:id/cancel` | owner | Cancel while Placed/Confirmed + restock |

### Account
| Method | Endpoint | Auth |
|---|---|---|
| GET / PATCH | `/users/profile` | user |
| PATCH | `/users/password` | user |
| GET / POST / DELETE | `/users/wishlist[/:productId]` | user |

### Admin (all require `role: admin`)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/admin/dashboard` | Stats, sales chart, low stock, top products, recent orders |
| GET | `/admin/orders` | All orders with search/status filter + pagination |
| PATCH | `/admin/orders/:id` | Update order/payment status (restocks on cancel) |
| GET | `/admin/customers` | Customers with order counts and spend |
| GET/POST/PATCH/DELETE | `/admin/categories` | Category management |

**Response shape:** success → `{ success: true, ... }` · failure → `{ success: false, message }`

---

## ✅ Testing checklist

Verified against a running instance (see §15 of the project prompt):

- [x] Registration: valid data, duplicate email (409), weak password, password mismatch, invalid phone/PIN
- [x] Login: correct credentials, wrong password (generic 401), missing auth (401)
- [x] Product data loaded from MongoDB (34 products, 9 categories)
- [x] Search / category / price / stock / crop filters, all 7 sort orders, empty state, pagination
- [x] Cart quantity updates, stock caps, subtotal/delivery/total math
- [x] Checkout: server-side price recomputation, stock validation, failed-order stock rollback, atomic decrement (no overselling)
- [x] Customers **cannot** read other customers' orders (403) or anonymous requests (401)
- [x] Ordinary users **cannot** reach admin endpoints (403)
- [x] Admin: product create/edit/deactivate/delete, category CRUD (delete blocked while in use), order status updates (invalid statuses rejected)
- [x] Order cancellation restores stock; cancelled orders excluded from revenue
- [x] Empty states, loading spinners, API error messages on every page
- [x] Responsive layouts at desktop / tablet / mobile breakpoints
- [x] Password change (wrong current password rejected), profile update, wishlist sync

---

## 🗄️ Database design

**User** — name, email (unique), phone, password hash (bcrypt, `select:false`), role (`customer|admin`), saved address, wishlist, timestamps

**Product** — name, description, category, type, brand, price, packSize, image(s), stockQuantity, crops[], seedInfo{}, labelInfo{}, specifications[], batch{}, demo/active/featured flags, timestamps + text index

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
