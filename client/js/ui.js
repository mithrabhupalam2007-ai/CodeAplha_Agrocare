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

  const stars = (rating) => {
    const r = Math.round(Number(rating) || 0);
    return '★'.repeat(r) + '☆'.repeat(5 - r);
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
  const NAV_LINKS = [
    { href: '/pages/home.html', label: 'Home', match: (p) => p.includes('home.html') },
    { href: '/pages/products.html', label: 'All Products', match: (p) => p.includes('products') && !location.search },
    { href: '/pages/products.html?type=Seeds', label: 'Seeds', match: () => new URLSearchParams(location.search).get('type') === 'Seeds' },
    { href: '/pages/products.html?type=Pesticides', label: 'Pesticides', match: () => new URLSearchParams(location.search).get('type') === 'Pesticides' },
    { href: '/pages/products.html?type=Fertilizers', label: 'Fertilizers', match: () => new URLSearchParams(location.search).get('type') === 'Fertilizers' },
    { href: '/pages/products.html?type=Farming%20Essentials', label: 'Farming Essentials', match: () => new URLSearchParams(location.search).get('type') === 'Farming Essentials' },
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
            Agro<em>Shield</em>
          </a>
          <nav aria-label="Main">
            <ul class="nav__links">
              ${NAV_LINKS.map(
                (l) =>
                  `<li><a href="${l.href}"${l.match(path) ? ' class="active" aria-current="page"' : ''}>${l.label}</a></li>`
              ).join('')}
            </ul>
          </nav>
          <form class="nav__search nav__search--desktop" role="search" data-nav-search>
            ${I.search}
            <input type="search" name="q" placeholder="Search seeds, tools..." value="${esc(q)}" aria-label="Search products" />
          </form>
          <div class="nav__actions">
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
                      <a href="/pages/account.html">My Account</a>
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
              <p>Your one-stop agricultural marketplace for quality seeds, crop protection products, fertilizers and everyday farming essentials — built for Indian farmers and gardeners.</p>
              <p class="mb-0" style="font-size:.8rem;opacity:.75;">Demo e-commerce project. Pesticide listings use clearly labelled demo data.</p>
            </div>
            <div>
              <h4>Shop</h4>
              <ul>
                <li><a href="/pages/products.html?type=Seeds">Seeds</a></li>
                <li><a href="/pages/products.html?type=Pesticides">Pesticides</a></li>
                <li><a href="/pages/products.html?type=Fertilizers">Fertilizers</a></li>
                <li><a href="/pages/products.html?type=Farming%20Essentials">Farming Essentials</a></li>
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
  /** Send the visitor to the login selection page, remembering where to come back to. */
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
      category: product.category,
      stock: product.stockQuantity,
    };
  }

  return {
    I, inr, formatDate, stars, esc, toast,
    mountNav, mountFooter, refreshBadges,
    requireLogin, requireAdmin, cartLine,
  };
})();

/* Keep the navbar in sync when login/logout/refresh changes auth state.
   Registered once, outside mountNav, so it never stacks up. */
document.addEventListener('auth:changed', () => UI.mountNav());

/* Re-export short names used by page scripts. */
const toast = UI.toast;
const I = UI.I;
