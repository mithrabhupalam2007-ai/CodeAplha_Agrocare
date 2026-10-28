/**
 * Shared UI kit: icons, toasts, money formatting, the navbar and footer
 * that every page mounts, plus route guards.
 */
const UI = (() => {
  /* ---------------- icons (24px feather-style strokes) ---------------- */
  const I = {
    leaf: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>',
    heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21.2l7.8-7.7 1-1.1a5.5 5.5 0 0 0 0-7.8Z"/></svg>',
    cart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1.6"/><circle cx="19" cy="21" r="1.6"/><path d="M2 3h2.2l2.4 12.4a2 2 0 0 0 2 1.6h9.1a2 2 0 0 0 2-1.6L22 7H5.3"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
    checkCircle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m8.5 12.5 2.5 2.5 4.5-5"/></svg>',
    alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>',
    truck: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 17V5H2v12h2"/><path d="M14 9h4l4 4v4h-2"/><circle cx="7" cy="17.5" r="2"/><circle cx="17" cy="17.5" r="2"/><path d="M9 17.5h6"/></svg>',
    shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></svg>',
    seed: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21v-8"/><path d="M12 13C12 9 9 6 5 6c0 4 3 7 7 7Z"/><path d="M12 13c0-3.3 2.7-6 6-6 0 3.3-2.7 6-6 6Z"/></svg>',
    refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 15.5-6.2L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15.5 6.2L3 16"/><path d="M3 21v-5h5"/></svg>',
    box: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21 8-9-5-9 5v8l9 5 9-5Z"/><path d="m3 8 9 5 9-5"/><path d="M12 13v8"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.8a2 2 0 0 1-.4 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.9.6 2.8.7a2 2 0 0 1 1.7 2Z"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 6 10-6"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    tag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.6 13.4 12 22 2 12V2h10l8.6 8.6a2 2 0 0 1 0 2.8Z"/><circle cx="7" cy="7" r="1.4"/></svg>',
    logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/></svg>',
    grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
    chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 3v18h18"/><path d="m7 14 4-4 3 3 5-6"/></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
    lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>',
    bag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 7h12l1.5 14h-15Z"/><path d="M9 10V6a3 3 0 0 1 6 0v4"/></svg>',
  };

  /* ---------------- formatting ---------------- */
  const inr = (n) =>
    '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  /** Date AND time — used on the order success page ("ordered at"). */
  const formatDateTime = (d) =>
    new Date(d).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });

  const stars = (rating) => {
    const r = Math.round(Number(rating) || 0);
    return '★'.repeat(r) + '☆'.repeat(5 - r);
  };

  /**
   * Inline rating snippet — "★★★★☆ 4.2/5.0" for the demo rating stored on
   * the product (stable demo data between 3.5 and 4.5, NOT verified
   * customer reviews). Empty string for records without a rating.
   */
  const ratingInline = (rating) => {
    const r = Number(rating);
    if (!r) return '';
    return `<span class="rating" title="Demo rating"><span class="rating__stars" aria-hidden="true">${stars(r)}</span>`
      + `<span class="rating__num">${r.toFixed(1)}/5.0</span></span>`;
  };

  const esc = (s) =>
    String(s == null ? '' : s).replace(/[&<>"']/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
    );

  /* ---------------- toasts ---------------- */
  let stack;
  function toast(message, kind = 'ok') {
    if (!stack) {
      stack = document.createElement('div');
      stack.className = 'toast-stack';
      document.body.appendChild(stack);
    }
    const el = document.createElement('div');
    el.className = `toast${kind === 'error' ? ' toast--error' : kind === 'info' ? ' toast--info' : ''}`;
    const icon = kind === 'error' ? I.alert : kind === 'info' ? I.info : I.checkCircle;
    el.innerHTML = `${icon}<span>${esc(message)}</span>`;
    stack.appendChild(el);
    setTimeout(() => {
      el.classList.add('out');
      setTimeout(() => el.remove(), 320);
    }, 3400);
  }

  /* ---------------- navbar ---------------- */
  /* The seven main categories come straight from the store taxonomy (exact
     order preserved), so nav links can never drift from the catalogue.
     Layout order per spec: Home first, then the seven categories. Each
     category link carries its own subcategories for the rounded dropdown. */
  const NAV_LINKS = [
    { href: '/pages/home.html', label: 'Home', match: (p) => p.includes('home.html') },
    ...TAXONOMY.MAIN.map((type) => ({
      href: TAXONOMY.categoryUrl(type),
      label: type,
      subs: TAXONOMY.subcategoriesOf(type).map((sub) => ({
        href: TAXONOMY.subcategoryUrl(type, sub),
        label: sub,
      })),
      match: () => new URLSearchParams(location.search).get('type') === type,
    })),
  ];

  function mountNav() {
    const mount = document.getElementById('site-nav');
    if (!mount) return;
    const path = location.pathname;
    const q = new URLSearchParams(location.search).get('q') || '';
    const user = authStore.user;

    mount.innerHTML = `
      <a class="skip-link" href="#main">Skip to content</a>
      <header class="nav">
        <div class="container nav__inner">
          <a class="brand" href="/pages/home.html" aria-label="AgroShield home">
            <span class="brand__mark">${I.leaf}</span>
            <span class="brand__text">
              <span class="brand__name">Agro<em>Shield</em></span>
              <span class="brand__tag">Smart Farming. Better Harvests.</span>
            </span>
          </a>
          <div class="nav__actions">
            <div class="nav__searchwrap" data-search-wrap>
              <button class="icon-btn" type="button" data-search-toggle aria-label="Search products"
                aria-expanded="false" title="Search">${I.search}</button>
              <form class="nav__search nav__search--pop" role="search" data-nav-search>
                ${I.search}
                <input type="search" name="q" placeholder="Search seeds, tools..." value="${esc(q)}" aria-label="Search products" />
              </form>
            </div>
            <a class="icon-btn" href="/pages/wishlist.html" title="Wishlist" aria-label="Wishlist">
              ${I.heart}<span class="count-badge" data-wish-count hidden>0</span>
            </a>
            <a class="icon-btn" href="/pages/cart.html" title="Cart" aria-label="Shopping cart">
              ${I.cart}<span class="count-badge" data-cart-count hidden>0</span>
            </a>
            ${
              user
                ? `<div class="user-menu" data-user-menu>
                    <button class="icon-btn" type="button" title="${esc(user.name)}" aria-label="Account menu" aria-haspopup="true" data-user-toggle>${I.user}</button>
                    <div class="user-menu__pop" data-user-pop>
                      <span class="user-menu__name">${esc(user.name)}<small>${esc(user.email)}</small></span>
                      <a href="/pages/account.html">My Profile</a>
                      <a href="/pages/account.html#orders">My Orders</a>
                      <a href="/pages/wishlist.html">Wishlist</a>
                      ${user.role === 'admin' ? '<a href="/pages/admin.html">Admin Dashboard</a>' : ''}
                      <button type="button" data-nav-logout>Logout</button>
                    </div>
                  </div>`
                : `<a class="icon-btn" href="/" title="Login" aria-label="Login">${I.user}</a>`
            }
            <button class="icon-btn nav__burger" type="button" aria-label="Menu" data-burger>${I.menu}</button>
          </div>
        </div>
        <nav aria-label="Main" class="nav__main">
          <ul class="nav__links container">
            ${NAV_LINKS.map((l) => {
              const drop = l.subs && l.subs.length
                ? `<div class="nav__drop" aria-label="${esc(l.label)} subcategories">${l.subs
                    .map((s) => `<a href="${s.href}">${esc(s.label)}</a>`)
                    .join('')}</div>`
                : '';
              return `<li class="${l.subs && l.subs.length ? 'has-drop' : ''}">
                <a href="${l.href}"${l.match(path) ? ' class="active" aria-current="page"' : ''}>${esc(l.label)}</a>${drop}</li>`;
            }).join('')}
          </ul>
        </nav>
        <div class="nav__mobile container" data-mobile-menu>
          ${NAV_LINKS.map((l) => `<a href="${l.href}">${l.label}</a>`).join('')}
          <form class="nav__search" role="search" data-nav-search>
            ${I.search}
            <input type="search" name="q" placeholder="Search products..." value="${esc(q)}" aria-label="Search products" />
          </form>
          <a href="/pages/account.html">My Account & Orders</a>
        </div>
      </header>`;

    mount.querySelector('[data-burger]').addEventListener('click', () => {
      mount.querySelector('[data-mobile-menu]').classList.toggle('open');
    });

    /* Search icon → rounded popover (same [data-nav-search] form contract,
       so the shared submit wiring below keeps working unchanged). */
    const sWrap = mount.querySelector('[data-search-wrap]');
    const sBtn = mount.querySelector('[data-search-toggle]');
    if (sWrap && sBtn) {
      const closeSearch = () => {
        sWrap.classList.remove('open');
        sBtn.setAttribute('aria-expanded', 'false');
      };
      sBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const open = sWrap.classList.toggle('open');
        sBtn.setAttribute('aria-expanded', String(open));
        if (open) sWrap.querySelector('input').focus();
      });
      document.addEventListener('click', (e) => {
        if (!sWrap.contains(e.target)) closeSearch();
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeSearch();
      });
    }

    // Account dropdown (profile / orders / wishlist / logout)
    const userMenu = mount.querySelector('[data-user-menu]');
    if (userMenu) {
      const pop = userMenu.querySelector('[data-user-pop]');
      userMenu.querySelector('[data-user-toggle]').addEventListener('click', (e) => {
        e.stopPropagation();
        pop.classList.toggle('open');
      });
      pop.querySelector('[data-nav-logout]').addEventListener('click', async () => {
        await authStore.logout();
        toast('Logged out.', 'info');
        setTimeout(() => (location.href = '/'), 350);
      });
      document.addEventListener('click', (e) => {
        if (!userMenu.contains(e.target)) pop.classList.remove('open');
      });
    }

    mount.querySelectorAll('[data-nav-search]').forEach((form) => {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const value = form.querySelector('input').value.trim();
        location.href = `/pages/products.html${value ? `?q=${encodeURIComponent(value)}` : ''}`;
      });
    });

    refreshBadges();
    // Any cart mutation (add / qty change / remove / clear) from anywhere on
    // the page updates the header counter — Store.writeCart dispatches this.
    if (!mountNav._badgeWired) {
      mountNav._badgeWired = true;
      document.addEventListener('cart:changed', refreshBadges);
    }
  }

  function refreshBadges() {
    const c = document.querySelector('[data-cart-count]');
    if (c) {
      const n = cart.count();
      c.textContent = n > 99 ? '99+' : n;
      c.hidden = n === 0;
    }
    const w = document.querySelector('[data-wish-count]');
    if (w) {
      const list = authStore.user ? authStore.user.wishlist || [] : [];
      w.textContent = list.length > 99 ? '99+' : list.length;
      w.hidden = list.length === 0;
    }
  }

  /* ---------------- footer ---------------- */
  function mountFooter() {
    const mount = document.getElementById('site-footer');
    if (!mount) return;
    mount.innerHTML = `
      <footer class="footer">
        <div class="container">
          <div class="footer__grid">
            <div>
              <a class="brand" href="/pages/home.html"><span class="brand__mark">${I.leaf}</span>Agro<em>Shield</em></a>
              <p>Your one-stop agricultural marketplace for quality seeds, crop protection, crop nutrition and farm equipment — built for Indian farmers and gardeners.</p>
              <p class="mb-0" style="font-size:.8rem;opacity:.75;">Demo e-commerce project. Crop-protection listings use clearly labelled demo data.</p>
            </div>
            <div>
              <h4>Shop</h4>
              <ul>
                ${TAXONOMY.MAIN.map(
                  (type) => `<li><a href="${TAXONOMY.categoryUrl(type)}">${esc(type)}</a></li>`
                ).join('')}
                <li><a href="/pages/products.html">All Products</a></li>
              </ul>
            </div>
            <div>
              <h4>Support</h4>
              <ul>
                <li><a href="/pages/account.html">My Account</a></li>
                <li><a href="/pages/account.html#orders">Track My Orders</a></li>
                <li><a href="/pages/cart.html">Shopping Cart</a></li>
                <li><a href="/pages/legal.html#shipping">Shipping Information</a></li>
                <li><a href="/pages/home.html#faq">FAQs</a></li>
                <li><a href="/pages/home.html#reviews">Customer Reviews</a></li>
              </ul>
            </div>
            <div>
              <h4>Contact</h4>
              <ul class="footer__contact">
                <li>${I.pin}<span>AgroShield Agri Market, Nashik, Maharashtra 422001, India</span></li>
                <li>${I.phone}<span>+91 98765 43210 (demo)</span></li>
                <li>${I.mail}<span>support@agroshield.example</span></li>
                <li>${I.clock}<span>Mon–Sat, 9:00 AM – 7:00 PM IST</span></li>
              </ul>
            </div>
          </div>
          <div class="footer__bottom">
            <span>© ${new Date().getFullYear()} AgroShield — demo project for internship presentation.</span>
            <span class="footer__legal">
              <a href="/pages/home.html#safety">Product Safety Info</a>
              <a href="/pages/home.html#faq">FAQs</a>
              <a href="/pages/legal.html#shipping">Shipping</a>
              <a href="/pages/legal.html#privacy">Privacy Policy</a>
              <a href="/pages/legal.html#terms">Terms</a>
              <a href="/pages/admin.html">Admin</a>
            </span>
          </div>
        </div>
      </footer>`;
  }

  /* ---------------- guards ---------------- */
  /** Send the visitor to the welcome/login page, remembering where to come back to. */
  /**
   * The signed-in user's saved delivery address, shaped for the orders API,
   * or a clear `error` message when it is incomplete. Shared by the cart's
   * Buy All flow and the product page's Buy Now direct order.
   */
  function savedAddressOf(user) {
    if (!user) return { error: 'Please log in again to place your order.' };
    const a = user.address || {};
    const missing = [];
    if (!user.name || user.name.trim().length < 2) missing.push('full name');
    if (!/^[6-9]\d{9}$/.test((user.phone || '').trim())) missing.push('a valid 10-digit mobile number');
    if ((a.line1 || '').trim().length < 3) missing.push('address line');
    if ((a.city || '').trim().length < 2) missing.push('city');
    if ((a.state || '').trim().length < 2) missing.push('state');
    if (!/^\d{6}$/.test((a.pincode || '').trim())) missing.push('6-digit PIN code');
    if (missing.length) {
      return {
        error: `We need a complete delivery address to place your order — please save your ${missing.join(
          ', '
        )} in My Account, then try again.`,
      };
    }
    return {
      address: {
        fullName: user.name.trim(),
        phone: user.phone.trim(),
        line1: a.line1.trim(),
        line2: (a.line2 || '').trim(),
        city: a.city.trim(),
        state: a.state.trim(),
        pincode: a.pincode.trim(),
      },
    };
  }

  function requireLogin() {
    if (authStore.isLoggedIn) return true;
    const returnTo = location.pathname + location.search + location.hash;
    location.href = `/?next=${encodeURIComponent(returnTo)}`;
    return false;
  }

  /** Admin pages/APIs: never trust the frontend — the server checks the role too. */
  function requireAdmin() {
    if (authStore.isAdmin) return true;
    if (authStore.isLoggedIn) {
      toast('Administrator access required. Redirecting you back home.', 'error');
      setTimeout(() => (location.href = '/pages/home.html'), 1200);
    } else {
      location.href = '/pages/admin-login.html';
    }
    return false;
  }

  /** Fill the price/stock stock of a "product → cart line" mapping helper. */
  function cartLine(product) {
    return {
      id: product._id,
      name: product.name,
      price: product.price,
      packSize: product.packSize,
      image: product.image,
      // Shown on cart/order rows: subcategory, else heading, else main.
      category: TAXONOMY.labelFor(product),
      stock: product.stockQuantity,
    };
  }

  /* ---------------- shared product card ---------------- */
  /**
   * The one product card used across home rails, the seasonal carousel,
   * category/subcategory pages and the catalogue. Shows the subcategory
   * chip (falling back to the heading section, then the main category, for
   * records not yet assigned a subcategory), backend availability,
   * wishlist toggle and a disabled purchase state for out-of-stock items.
   * `chipLabel` overrides the chip — the category page passes the sub being
   * viewed so cross-listed records name the sub you are browsing.
   */
  function productCard(p, chipLabel) {
    const d = document.createElement('article');
    d.className = 'p-card';
    // Availability comes from the backend (active AND stock > 0 AND not
    // manually blocked) — never re-derived in the browser.
    const available = p.available !== false;
    const stockCls = !available ? 'out' : p.stockStatus === 'low' ? 'low' : 'in';
    const stockTxt = !available
      ? p.stockStatus === 'unavailable'
        ? 'Unavailable'
        : 'Out of Stock'
      : p.stockStatus === 'low'
        ? `Low Stock · ${p.stockQuantity} left`
        : 'In Stock';
    const wished = ((authStore.user && authStore.user.wishlist) || []).includes(p._id);
    const subLabel = chipLabel || TAXONOMY.labelFor(p);

    d.innerHTML = `
      <div class="p-card__media">
        <div class="p-card__flags">
          ${p.isNewRelease ? '<span class="badge badge--green">New</span>' : ''}
          ${p.bestseller ? '<span class="badge badge--amber">Bestseller</span>' : ''}
          ${p.featured ? '<span class="badge badge--green">Featured</span>' : ''}
          ${p.isSeasonal ? '<span class="badge badge--teal">Seasonal</span>' : ''}
          ${p.discountPercent > 0 ? `<span class="badge badge--red">${p.discountPercent}% off</span>` : ''}
          ${!available ? '<span class="badge badge--red">Out of Stock</span>' : ''}
        </div>
        <button class="p-card__wish ${wished ? 'on' : ''}" type="button" aria-label="Toggle wishlist" data-wish>${I.heart}</button>
        <a href="/pages/product-details.html?id=${p._id}">
          <img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" />
        </a>
      </div>
      <div class="p-card__body">
        <span class="p-card__cat">${esc(subLabel)}</span>
        <h3 class="p-card__name"><a href="/pages/product-details.html?id=${p._id}">${esc(p.name)}</a></h3>
        ${ratingInline(p.rating)}
        <div class="p-card__meta">
          <span>${esc(p.packSize)}</span>
          <span class="p-card__stock ${stockCls}"><span class="dot"></span>${stockTxt}</span>
        </div>
        <div class="p-card__price-row">
          <span class="price">${inr(p.price)}</span>
          ${p.discountPercent > 0 ? `<span class="price-old">${inr(p.mrp)}</span>` : ''}
        </div>
      </div>
      <div class="p-card__actions">
        <button class="btn btn--primary" type="button" data-add ${available ? '' : 'disabled'}>
          ${available ? 'Add to Cart' : 'Out of Stock'}
        </button>
        <a class="btn btn--ghost btn--sm" href="/pages/product-details.html?id=${p._id}">Details</a>
      </div>`;

    const addBtn = d.querySelector('[data-add]');
    addBtn.addEventListener('click', () => {
      if (!available) return;
      // Merges into an existing line (+1) instead of duplicating it, and is
      // capped at the known stock — see Store.Cart.add.
      cart.add(cartLine(p), 1);
      refreshBadges();
      toast(`Added to cart successfully — ${p.name}`);
      // Brief confirmed state on the button (re-clicks still add again).
      if (!addBtn.dataset.busy) {
        const label = addBtn.textContent;
        addBtn.dataset.busy = '1';
        addBtn.textContent = '✓ Added';
        addBtn.classList.add('is-added');
        setTimeout(() => {
          addBtn.textContent = label;
          addBtn.classList.remove('is-added');
          delete addBtn.dataset.busy;
        }, 1300);
      }
    });

    d.querySelector('[data-wish]').addEventListener('click', (e) => toggleWishlist(p, e.currentTarget));
    return d;
  }

  /** Wishlist toggle used by every shared card; keeps server + badge in sync. */
  async function toggleWishlist(product, btn) {
    if (!requireLogin()) return;
    const isOn = btn.classList.contains('on');
    try {
      if (isOn) {
        await api.del(`/users/wishlist/${product._id}`);
        btn.classList.remove('on');
        // authStore.user is a getter (fresh object on every read) — assign
        // the whole object so the setter persists the change to storage.
        authStore.user = {
          ...authStore.user,
          wishlist: (authStore.user.wishlist || []).filter((id) => id !== product._id),
        };
        toast('Removed from wishlist', 'info');
      } else {
        await api.post(`/users/wishlist/${product._id}`);
        btn.classList.add('on');
        authStore.user = {
          ...authStore.user,
          wishlist: [...new Set([...(authStore.user.wishlist || []), product._id])],
        };
        toast('Added to wishlist');
      }
      refreshBadges();
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  /* ---------------- horizontal carousel ---------------- */
  /**
   * Wire prev/next arrows for a horizontal track. The track itself is a
   * scroll-snap flex row, so touch swiping already works natively on mobile.
   * Accepts either the [data-carousel] track itself or a wrapper that
   * contains it; the buttons live in a sibling .section-head, so we look for
   * them in the track's parent scope. Idempotent — re-calling is a no-op.
   */
  function wireCarousel(root) {
    if (!root) return;
    const isTrack = !!root.matches && root.matches('[data-carousel]');
    const track = isTrack ? root : root.querySelector('[data-carousel]');
    if (!track || track.dataset.wired === '1') return;
    const scope = isTrack ? root.parentElement || document : root;
    const prev = scope.querySelector('[data-prev]');
    const next = scope.querySelector('[data-next]');
    track.dataset.wired = '1';
    const step = () => Math.max(240, Math.round(track.clientWidth * 0.8));
    if (prev) prev.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
    if (next) next.addEventListener('click', () => track.scrollBy({ left: step(), behavior: 'smooth' }));
    const sync = () => {
      if (prev) prev.disabled = track.scrollLeft <= 4;
      if (next) next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
    };
    track.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    // Arrows need a frame once images/cards have laid out.
    requestAnimationFrame(sync);
    setTimeout(sync, 300);
    sync();
  }

  return {
    I, inr, formatDate, formatDateTime, stars, ratingInline, esc, toast,
    mountNav, mountFooter, refreshBadges,
    requireLogin, requireAdmin, cartLine, savedAddressOf,
    productCard, toggleWishlist, wireCarousel,
  };
})();

/* Keep the navbar in sync when login/logout/refresh changes auth state.
   Registered once, outside mountNav, so it never stacks up. */
document.addEventListener('auth:changed', () => UI.mountNav());

/* Global broken-image fallback: any <img> on any page that fails to load is
   swapped once for the shared demo placeholder (alt text is kept intact).
   Capture phase is required — error events from images do not bubble.
   The dataset guard stops a loop if the fallback itself ever fails. */
const FALLBACK_IMG = '/images/categories/image-fallback.svg';
window.addEventListener(
  'error',
  (e) => {
    const el = e.target;
    if (!el || el.tagName !== 'IMG' || el.dataset.fallbackApplied) return;
    el.dataset.fallbackApplied = '1';
    el.src = FALLBACK_IMG;
  },
  true
);

/* Subtle scroll fade-in for `.reveal` elements (home benefit cards).
   body.reveal-ready gates the hidden state in CSS — if this script or the
   IntersectionObserver never runs, the content simply stays visible. */
(() => {
  const els = [...document.querySelectorAll('.reveal')];
  if (!els.length || !('IntersectionObserver' in window)) return;
  document.body.classList.add('reveal-ready');
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-visible');
        io.unobserve(en.target);
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -30px' }
  );
  els.forEach((el) => io.observe(el));
})();

/* Re-export short names used by page scripts. */
const toast = UI.toast;
const I = UI.I;
