/**
 * Cart page: renders local cart, quantity controls, removal,
 * subtotal / delivery / total preview.
 *
 * Live availability: every line is re-checked against the database when the
 * page loads. Unavailable items are clearly labelled, quantities are capped
 * at the real stock and Buy All is blocked until the cart is purchasable.
 * The server re-validates everything again when the order is placed.
 */
(() => {
  const FREE_THRESHOLD = 499;
  const FLAT_DELIVERY = 49;

  const $ = (id) => document.getElementById(id);
  /** id -> latest known server state ({available, stock, price, status, gone}) */
  const live = new Map();

  const infoOf = (item) => live.get(item.id) || null;
  const stockOf = (item) => {
    const info = infoOf(item);
    if (info && typeof info.stock === 'number') return info.stock;
    return Number.isFinite(item.stock) ? item.stock : 999;
  };

  /* Cart lines persist to localStorage, so ones written by the old
     pre-restructure UI can still carry a retired category label. Never
     render those names again. */
  const RETIRED_LABELS = ['Pesticides', 'Fertilizers', 'Farming Essentials'];
  const cartLineLabel = (item) =>
    RETIRED_LABELS.includes(item.category) ? '' : item.category || '';

  /** Returns a list of human-readable blockers that must be fixed first. */
  function blockers() {
    const list = [];
    cart.items().forEach((item) => {
      const info = infoOf(item);
      if (!info) return; // not checked yet — do not block prematurely
      if (info.gone) list.push(`"${item.name}" is no longer sold. Remove it to continue.`);
      else if (!info.available) list.push(`"${item.name}" is out of stock. Remove it to continue.`);
      else if (item.qty > info.stock)
        list.push(`Only ${info.stock} of "${item.name}" in stock — reduce the quantity.`);
    });
    return list;
  }

  function applyCheckoutState() {
    const buttons = document.querySelectorAll('[data-checkout-gate]');
    const alertBox = $('cart-alert');
    if (!buttons.length) return;
    const issues = blockers();
    buttons.forEach((btn) => {
      if (issues.length) {
        alertBox.innerHTML = `<strong>Buy All unavailable</strong><br>${issues.map((i) => UI.esc(i)).join('<br>')}`;
        alertBox.classList.add('show');
        btn.classList.add('is-disabled');
        btn.setAttribute('aria-disabled', 'true');
        btn.addEventListener('click', blockClick, { once: true });
      } else {
        alertBox.classList.remove('show');
        alertBox.innerHTML = '';
        btn.classList.remove('is-disabled');
        btn.removeAttribute('aria-disabled');
      }
    });
  }

  function blockClick(e) {
    if (blockers().length) {
      e.preventDefault();
      toast('Please fix the cart issues above before using Buy All.', 'error');
    }
  }

  function render() {
    const items = cart.items();
    const empty = $('cart-empty');
    const layout = $('cart-layout');

    if (!items.length) {
      empty.classList.remove('hidden');
      layout.classList.add('hidden');
      UI.refreshBadges();
      return;
    }
    empty.classList.add('hidden');
    layout.classList.remove('hidden');

    const wrap = $('cart-items');
    wrap.innerHTML = '';

    items.forEach((item) => {
      const info = infoOf(item);
      const gone = Boolean(info && info.gone);
      const oos = Boolean(info && !info.gone && !info.available);
      const stock = stockOf(item);
      const row = document.createElement('div');
      row.className = `cart-item${gone || oos ? ' cart-item--blocked' : ''}`;

      let stateNote = '';
      if (gone) {
        stateNote = `<div class="cart-item__blocked-note">⚠ No longer available — this product was removed or deactivated. <a href="/pages/products.html">Find alternatives</a></div>`;
      } else if (oos) {
        stateNote = `<div class="cart-item__blocked-note">⚠ Out of Stock — unavailable for purchase right now. <a href="/pages/product-details.html?id=${item.id}">View product page</a></div>`;
      } else if (info && item.qty > info.stock) {
        stateNote = `<div class="cart-item__blocked-note">⚠ Only ${info.stock} left — reduce the quantity to check out.</div>`;
      }

      row.innerHTML = `
        <a href="/pages/product-details.html?id=${item.id}">
          <img class="cart-item__img" src="${UI.esc(item.image)}" alt="${UI.esc(item.name)}" />
        </a>
        <div>
          <div class="cart-item__name"><a href="/pages/product-details.html?id=${item.id}">${UI.esc(item.name)}</a></div>
          <div class="cart-item__meta">${[UI.esc(cartLineLabel(item)), UI.esc(item.packSize), UI.inr(item.price) + ' each'].filter(Boolean).join(' · ')}</div>
          ${stateNote}
          <button class="cart-item__remove" type="button" data-remove>Remove</button>
        </div>
        <div class="cart-item__right">
          <div class="qty">
            <button type="button" data-minus aria-label="Decrease" ${gone || oos ? 'disabled' : ''}>−</button>
            <input type="number" value="${item.qty}" min="1" max="${stock}" data-qty aria-label="Quantity" ${gone || oos ? 'disabled' : ''} />
            <button type="button" data-plus aria-label="Increase" ${gone || oos ? 'disabled' : ''}>+</button>
          </div>
          <span class="price">${UI.inr(item.price * item.qty)}</span>
        </div>`;

      row.querySelector('[data-remove]').addEventListener('click', () => {
        cart.remove(item.id);
        live.delete(item.id);
        UI.refreshBadges();
        toast('Item removed from cart', 'info');
        render();
      });

      row.querySelector('[data-minus]').addEventListener('click', () => {
        cart.setQty(item.id, item.qty - 1);
        UI.refreshBadges();
        render();
      });

      row.querySelector('[data-plus]').addEventListener('click', () => {
        if (item.qty >= stock) {
          toast(`Only ${stock} unit(s) in stock`, 'error');
          return;
        }
        cart.setQty(item.id, item.qty + 1);
        UI.refreshBadges();
        render();
      });

      row.querySelector('[data-qty]').addEventListener('change', (e) => {
        let q = parseInt(e.target.value, 10);
        if (Number.isNaN(q) || q < 1) q = 1;
        if (q > stock) {
          q = stock;
          toast(`Quantity capped at stock level (${stock})`, 'info');
        }
        cart.setQty(item.id, q);
        UI.refreshBadges();
        render();
      });

      wrap.appendChild(row);
    });

    const subtotal = cart.subtotal();
    const delivery = subtotal >= FREE_THRESHOLD ? 0 : FLAT_DELIVERY;
    const total = subtotal + delivery;

    $('cart-count').textContent = `${cart.count()} item${cart.count() === 1 ? '' : 's'}`;
    $('sum-subtotal').textContent = UI.inr(subtotal);
    $('sum-delivery').textContent = delivery === 0 ? 'FREE' : UI.inr(delivery);
    $('sum-total').textContent = UI.inr(total);

    const pct = Math.min(100, Math.round((subtotal / FREE_THRESHOLD) * 100));
    $('free-ship-bar').style.width = `${pct}%`;
    $('free-ship-note').textContent =
      subtotal >= FREE_THRESHOLD
        ? '🎉 You have unlocked free delivery!'
        : `Add ${UI.inr(FREE_THRESHOLD - subtotal)} more for free delivery.`;

    applyCheckoutState();
  }

  /**
   * Re-check every cart line against the database: availability, real stock
   * and current price. Falls back to "no longer available" on 404.
   */
  async function checkAvailability() {
    const items = cart.items();
    await Promise.all(
      items.map(async (item) => {
        try {
          const data = await api.get(`/products/${item.id}`);
          const p = data.product;
          const state = {
            available: p.available !== false,
            stock: p.stockQuantity,
            price: p.price,
            status: p.stockStatus,
            gone: false,
          };
          live.set(item.id, state);
          // Keep the local cart in sync with current database values.
          const patch = {};
          if (Number.isFinite(state.price) && state.price !== item.price) patch.price = state.price;
          if (typeof state.stock === 'number' && state.stock !== item.stock) patch.stock = state.stock;
          if (Object.keys(patch).length) cart.patch(item.id, patch);
          // auto-clamp quantities that exceed the real stock
          if (state.available && item.qty > state.stock) cart.setQty(item.id, Math.max(1, state.stock));
        } catch (err) {
          live.set(item.id, { available: false, gone: true });
        }
      })
    );
    render();
  }

  document.addEventListener('DOMContentLoaded', () => {
    UI.mountNav();
    UI.mountFooter();
    if (!UI.requireLogin()) return; // shop is only reachable after login
    render();
    checkAvailability(); // async — re-renders with live database state
    document.addEventListener('cart:changed', render);
    if (authStore.isLoggedIn) authStore.refresh();
  });
})();
