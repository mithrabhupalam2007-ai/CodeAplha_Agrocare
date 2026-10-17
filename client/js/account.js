/**
 * Account page: profile editing, order history with cancellation,
 * wishlist management, password change and logout.
 */
(() => {
  const $ = (id) => document.getElementById(id);
  let ordersCache = [];

  /* ================= tabs ================= */
  function switchTab(name) {
    if (name === 'logout') {
      authStore.logout().then(() => {
        toast('Logged out successfully.', 'info');
        setTimeout(() => (location.href = '/'), 500);
      });
      return;
    }
    document.querySelectorAll('.side-nav button').forEach((b) =>
      b.classList.toggle('active', b.dataset.tab === name)
    );
    document.querySelectorAll('.tab-panel').forEach((p) =>
      p.classList.toggle('hidden', p.dataset.panel !== name)
    );
    history.replaceState({}, '', `#${name}`);

    if (name === 'orders' && !ordersCache.length) loadOrders();
    if (name === 'wishlist') loadWishlist();
  }

  /* ================= profile ================= */
  function fillProfile() {
    const u = authStore.user;
    if (!u) return;
    $('welcome-line').textContent = `Welcome back, ${u.name}. Manage your profile, orders and wishlist.`;
    $('p-name').value = u.name || '';
    $('p-phone').value = u.phone || '';
    $('p-email').value = u.email || '';
    const a = u.address || {};
    $('p-line1').value = a.line1 || '';
    $('p-city').value = a.city || '';
    $('p-state').value = a.state || '';
    $('p-pincode').value = a.pincode || '';
    $('ov-joined').textContent = u.createdAt ? UI.formatDate(u.createdAt) : '—';
    $('ov-role').textContent = u.role === 'admin' ? 'Administrator' : 'Customer';
    $('ov-wish').textContent = (u.wishlist || []).length;
  }

  async function saveProfile(e) {
    e.preventDefault();
    const box = $('profile-alert');
    box.classList.remove('show');

    const body = {
      name: $('p-name').value.trim(),
      phone: $('p-phone').value.trim(),
      address: {
        line1: $('p-line1').value.trim(),
        city: $('p-city').value.trim(),
        state: $('p-state').value.trim(),
        pincode: $('p-pincode').value.trim(),
      },
    };

    try {
      const data = await api.patch('/users/profile', body);
      authStore.user = data.user;
      localStorage.setItem('agroshield_user', JSON.stringify(data.user));
      fillProfile();
      box.className = 'alert show alert--success';
      box.textContent = data.message;
      toast(data.message);
    } catch (err) {
      box.className = 'alert show alert--error';
      box.textContent = err.message;
      toast(err.message, 'error');
    }
  }

  /* ================= orders ================= */
  function statusPill(status) {
    return `<span class="status-pill status-${status.toLowerCase()}">${status}</span>`;
  }

  const PAY_LABEL = { cod: 'Cash on Delivery', demo: 'Demo payment' };
  const PAY_STATUS_LABEL = {
    pending: 'Pending',
    paid: 'Paid (demo)',
    failed: 'Failed',
    refunded: 'Refunded',
  };

  function renderOrders(orders) {
    const wrap = $('orders-list');
    const filter = $('order-filter').value;
    const list = filter ? orders.filter((o) => o.orderStatus === filter) : orders;

    if (!list.length) {
      wrap.innerHTML = `
        <div class="empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="m21 8-9-5-9 5v8l9 5 9-5Z"/><path d="m3 8 9 5 9-5"/><path d="M12 13v8"/></svg>
          <h3>${filter ? 'No orders with this status' : 'No orders yet'}</h3>
          <p>${filter ? 'Try another status filter.' : 'Your orders will appear here after you shop.'}</p>
          <a class="btn btn--primary" href="/pages/products.html">Start shopping</a>
        </div>`;
      return;
    }

    wrap.innerHTML = '';
    list.forEach((o) => {
      const card = document.createElement('article');
      card.className = 'order-card';
      const cancellable = ['Placed', 'Confirmed'].includes(o.orderStatus);

      card.innerHTML = `
        <div class="order-card__head">
          <span class="oid">#${UI.esc(o.orderId)}</span>
          <span>Placed on ${UI.formatDate(o.createdAt)}</span>
          ${statusPill(o.orderStatus)}
        </div>
        <div class="order-card__body">
          ${o.items
            .map(
              (it) => `
            <div class="order-line">
              <img src="${UI.esc(it.image)}" alt="" />
              <span class="grow">
                <span class="nm">${UI.esc(it.name)}</span>
                <span class="qt">${it.quantity} × ${UI.esc(it.packSize)} @ ${UI.inr(it.price)}</span>
              </span>
              <span class="price">${UI.inr(it.lineTotal)}</span>
            </div>`
            )
            .join('')}
          ${
            o.statusHistory && o.statusHistory.length
              ? `<div class="timeline">${o.statusHistory
                  .map(
                    (h) =>
                      `<span class="tl"><b>${h.status}</b>${new Date(h.at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>`
                  )
                  .join('')}</div>`
              : ''
          }
        </div>
        <div class="order-card__foot">
          <span>
            <b>${UI.inr(o.total)}</b>
            <span class="text-muted"> · ${PAY_LABEL[o.paymentMethod] || o.paymentMethod} · ${PAY_STATUS_LABEL[o.paymentStatus] || o.paymentStatus}</span>
          </span>
          ${
            cancellable
              ? `<button class="btn btn--danger btn--sm" data-cancel>Cancel order</button>`
              : `<span class="text-muted" style="font-size:.82rem;">${o.orderStatus === 'Cancelled' ? 'This order was cancelled' : 'Track status above'}</span>`
          }
        </div>`;

      const cancelBtn = card.querySelector('[data-cancel]');
      if (cancelBtn) {
        cancelBtn.addEventListener('click', async () => {
          if (!confirm(`Cancel order #${o.orderId}? Stock will be restored immediately.`)) return;
          cancelBtn.disabled = true;
          try {
            const data = await api.patch(`/orders/${o._id}/cancel`, { reason: 'Cancelled from My Orders' });
            toast(data.message);
            ordersCache = [];
            await loadOrders();
          } catch (err) {
            toast(err.message, 'error');
            cancelBtn.disabled = false;
          }
        });
      }

      wrap.appendChild(card);
    });

    $('ov-orders').textContent = orders.length;
  }

  async function loadOrders() {
    const wrap = $('orders-list');
    wrap.innerHTML = '<div class="spinner"></div>';
    try {
      const data = await api.get('/orders/my');
      ordersCache = data.orders;
      renderOrders(ordersCache);
    } catch (err) {
      wrap.innerHTML = `<div class="alert show alert--error">${UI.esc(err.message)}</div>`;
    }
  }

  /* ================= wishlist ================= */
  function wishCard(p) {
    const d = document.createElement('article');
    d.className = 'p-card';
    d.innerHTML = `
      <div class="p-card__media">
        <button class="p-card__wish on" type="button" aria-label="Remove from wishlist" data-wish>${I.heart}</button>
        <a href="/pages/product-details.html?id=${p._id}"><img src="${UI.esc(p.image)}" alt="${UI.esc(p.name)}" loading="lazy" /></a>
      </div>
      <div class="p-card__body">
        <span class="p-card__cat">${UI.esc(p.category)}</span>
        <h3 class="p-card__name"><a href="/pages/product-details.html?id=${p._id}">${UI.esc(p.name)}</a></h3>
        <div class="p-card__meta"><span>${UI.esc(p.packSize)}</span>
          <span class="p-card__stock ${p.stockQuantity > 0 ? 'in' : 'out'}"><span class="dot"></span>${p.stockQuantity > 0 ? 'In stock' : 'Out of stock'}</span>
        </div>
        <div class="p-card__price-row"><span class="price">${UI.inr(p.price)}</span></div>
      </div>
      <div class="p-card__actions">
        <button class="btn btn--primary" type="button" data-add ${p.stockQuantity <= 0 ? 'disabled' : ''}>${p.stockQuantity <= 0 ? 'Out of stock' : 'Add to Cart'}</button>
        <a class="btn btn--ghost btn--sm" href="/pages/product-details.html?id=${p._id}">Details</a>
      </div>`;

    d.querySelector('[data-add]').addEventListener('click', () => {
      cart.add(UI.cartLine(p), 1);
      UI.refreshBadges();
      toast(`${p.name} added to cart`);
    });

    d.querySelector('[data-wish]').addEventListener('click', async () => {
      try {
        await api.del(`/users/wishlist/${p._id}`);
        authStore.user.wishlist = (authStore.user.wishlist || []).filter((id) => id !== p._id);
        localStorage.setItem('agroshield_user', JSON.stringify(authStore.user));
        UI.refreshBadges();
        toast('Removed from wishlist', 'info');
        loadWishlist();
      } catch (err) {
        toast(err.message, 'error');
      }
    });
    return d;
  }

  async function loadWishlist() {
    const grid = $('wishlist-grid');
    const empty = $('wishlist-empty');
    grid.innerHTML = '<div class="spinner" style="grid-column:1/-1;"></div>';
    empty.classList.add('hidden');
    try {
      const data = await api.get('/users/wishlist');
      grid.innerHTML = '';
      if (!data.wishlist.length) {
        grid.classList.add('hidden');
        empty.classList.remove('hidden');
        return;
      }
      grid.classList.remove('hidden');
      data.wishlist.forEach((p) => grid.appendChild(wishCard(p)));
      $('ov-wish').textContent = data.wishlist.length;
    } catch (err) {
      grid.innerHTML = `<div class="alert show alert--error" style="grid-column:1/-1;">${UI.esc(err.message)}</div>`;
    }
  }

  /* ================= password ================= */
  async function changePassword(e) {
    e.preventDefault();
    const box = $('pw-alert');
    box.classList.remove('show');
    const current = $('cur-pw').value;
    const next = $('new-pw').value;
    const confirmPw = $('conf-pw').value;

    if (next.length < 8 || !/[a-zA-Z]/.test(next) || !/\d/.test(next)) {
      box.className = 'alert show alert--error';
      box.textContent = 'New password must be at least 8 characters with letters and numbers.';
      return;
    }
    if (next !== confirmPw) {
      box.className = 'alert show alert--error';
      box.textContent = 'New passwords do not match.';
      return;
    }

    try {
      const data = await api.patch('/users/password', { currentPassword: current, newPassword: next });
      box.className = 'alert show alert--success';
      box.textContent = data.message;
      $('pw-form').reset();
      toast(data.message);
    } catch (err) {
      box.className = 'alert show alert--error';
      box.textContent = err.message;
      toast(err.message, 'error');
    }
  }

  /* ================= boot ================= */
  document.addEventListener('DOMContentLoaded', async () => {
    UI.mountNav();
    UI.mountFooter();

    if (!UI.requireLogin()) return;

    const user = await authStore.refresh();
    if (!user) return; // session expired -> requireLogin handles on reload

    $('loader').classList.add('hidden');
    $('account-root').classList.remove('hidden');
    fillProfile();

    document.querySelectorAll('.side-nav button').forEach((b) =>
      b.addEventListener('click', () => switchTab(b.dataset.tab))
    );
    $('profile-form').addEventListener('submit', saveProfile);
    $('pw-form').addEventListener('submit', changePassword);
    $('order-filter').addEventListener('change', () => renderOrders(ordersCache));

    document.querySelectorAll('[data-pw-toggle]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const input = btn.parentElement.querySelector('input');
        const showing = input.type === 'text';
        input.type = showing ? 'password' : 'text';
        btn.textContent = showing ? 'Show' : 'Hide';
      });
    });

    // deep link: account.html#orders / #wishlist etc.
    const hash = location.hash.replace('#', '');
    const valid = ['profile', 'orders', 'wishlist', 'password'];
    switchTab(valid.includes(hash) ? hash : 'profile');
    if (!valid.includes(hash)) loadOrders();

    UI.refreshBadges();
  });
})();
