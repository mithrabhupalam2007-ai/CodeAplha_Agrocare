/**
 * Cart page: renders local cart, quantity controls, removal,
 * subtotal / delivery / total preview, and the direct **Buy All**
 * purchase (no checkout page — the order is placed right here).
 *
 * Live availability: every line is re-checked against the database when the
 * page loads. Unavailable items are clearly labelled, quantities are capped
 * at the real stock and Buy All is blocked until the cart is purchasable.
 * Buy All re-checks once more at click time, then POSTs the order with the
 * account's saved address and Cash on Delivery; the server re-validates
 * everything, computes the real total and decrements stock atomically.
 * The cart is cleared only after the backend confirms the order, and the
 * browser lands on the Order Successful page.
 */
(() => {
  const FREE_THRESHOLD = 499;
  const FLAT_DELIVERY = 49;

  const $ = (id) => document.getElementById(id);
  /** id -> latest known server state ({available, stock, price, status, gone}) */
  const live = new Map();
  /** True while lines are being re-validated against the database — the qty
     controls render disabled with a note until the check finishes. */
  let checking = true;

  /**
   * Visual "update in progress" pulse on a freshly re-rendered row: the
   * stepper dims and blocks clicks for a moment so feedback is visible even
   * though the local write is synchronous.
   */
  function pulseQty(id) {
    const row = document.querySelector(`#cart-items .cart-item[data-id="${CSS.escape(id)}"]`);
    const qty = row && row.querySelector('.qty');
    if (!qty) return;
    qty.classList.add('is-busy');
    qty.setAttribute('aria-busy', 'true');
    setTimeout(() => {
      if (!qty.isConnected) return;
      qty.classList.remove('is-busy');
      qty.removeAttribute('aria-busy');
    }, 280);
  }

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
      } else {
        alertBox.classList.remove('show');
        alertBox.innerHTML = '';
        btn.classList.remove('is-disabled');
        btn.removeAttribute('aria-disabled');
      }
    });
  }

  /* ---------------- Buy All: place the order directly ----------------
   * No checkout page: the order is submitted straight from the cart
   * using the account's saved delivery address and the project's
   * Cash on Delivery payment method (payment status: pending — nothing
   * is ever marked paid without a real confirmation).
   * The server re-validates availability/stock and recomputes every
   * price from the database; the cart is cleared only after the backend
   * confirms the order, and a per-page clientRequestId collapses
   * repeated clicks into a single order.
   * ------------------------------------------------------------- */
  const clientRequestId = (() => {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return `cr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
  })();

  let placing = false;

  function showCartError(message) {
    const box = $('cart-alert');
    box.innerHTML = message;
    box.classList.add('show');
    box.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  /** The saved profile address, or a clear error if it is incomplete. */
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
        )} in <a href="/pages/account.html"><b>My Account</b></a>, then try again.`,
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

  async function placeOrder() {
    if (placing) return; // ignore repeated clicks while one is in flight
    const btn = $('buy-all-btn');

    if (!cart.items().length) {
      toast('Your cart is empty.', 'error');
      return;
    }
    if (blockers().length) {
      toast('Please fix the cart issues above before using Buy All.', 'error');
      return;
    }

    placing = true;
    btn.disabled = true;
    btn.classList.add('is-disabled');
    const label = btn.textContent;
    btn.textContent = 'Placing your order…';

    try {
      // 1. Final availability check — same rules the server enforces.
      await checkAvailability();
      // checkAvailability() re-renders; keep the in-flight button state.
      btn.disabled = true;
      btn.classList.add('is-disabled');
      btn.textContent = 'Placing your order…';
      if (blockers().length) {
        toast('Some items in your cart became unavailable. Please review your cart.', 'error');
        return;
      }

      // 2. Delivery address from the logged-in account (no checkout form).
      const user = await authStore.refresh();
      const { address, error } = savedAddressOf(user);
      if (error) {
        showCartError(error);
        toast('Please complete your delivery address first.', 'error');
        return;
      }

      // 3. Submit — the server owns pricing, stock and totals.
      const data = await api.post('/orders', {
        items: cart.toPayload(),
        clientRequestId,
        paymentMethod: 'cod', // existing project method: pay on delivery
        shippingAddress: address,
      });

      // 4. Only after backend confirmation: clear the purchased lines.
      const bought = new Set(data.cartItemIds || []);
      cart.items()
        .filter((i) => bought.has(i.id))
        .forEach((i) => cart.remove(i.id));
      UI.refreshBadges();

      // 5. Straight to the Order Successful page (never via checkout).
      toast(data.alreadyPlaced ? 'This order was already placed — showing your receipt.' : 'Order placed successfully!');
      location.href = `/pages/order-confirmation.html?id=${encodeURIComponent(data.order.orderId)}`;
    } catch (err) {
      if (err.status === 401) {
        toast('Please log in to place your order.', 'error');
        setTimeout(
          () => (location.href = '/pages/login.html?next=' + encodeURIComponent('/pages/cart.html')),
          1200
        );
        return;
      }
      showCartError(`<strong>Order not placed</strong><br>${UI.esc(err.message)}`);
      toast(err.message, 'error');
      if (err.status === 409) applyCheckoutState(); // refresh the blocked state
    } finally {
      placing = false;
      btn.textContent = label;
      btn.disabled = blockers().length > 0;
      btn.classList.toggle('is-disabled', btn.disabled);
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
      row.dataset.id = item.id;
      // While the database re-check is running, the stepper renders disabled
      // with a note — no quantity can exceed stock before we know it.
      const held = checking;

      let stateNote = '';
      if (held) {
        stateNote = `<div class="cart-item__blocked-note cart-item__checking">⏳ Checking current stock and prices…</div>`;
      } else if (gone) {
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
          <div class="qty${held ? ' is-busy' : ''}"${held ? ' aria-busy="true"' : ''}>
            <button type="button" data-minus aria-label="Decrease" ${gone || oos || held ? 'disabled' : ''}>−</button>
            <input type="number" value="${item.qty}" min="1" max="${stock}" data-qty aria-label="Quantity" ${gone || oos || held ? 'disabled' : ''} />
            <button type="button" data-plus aria-label="Increase" ${gone || oos || held ? 'disabled' : ''}>+</button>
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

      // One path for every quantity update: write → badge → re-render →
      // visible "in progress" pulse on the fresh row's stepper.
      const applyQty = (next) => {
        cart.setQty(item.id, next);
        UI.refreshBadges();
        render();
        pulseQty(item.id);
      };

      row.querySelector('[data-minus]').addEventListener('click', () => {
        if (item.qty <= 1) {
          // Existing design: quantity zero removes the line (never negative).
          cart.remove(item.id);
          live.delete(item.id);
          UI.refreshBadges();
          toast('Item removed from cart', 'info');
          render();
          return;
        }
        applyQty(item.qty - 1);
      });

      row.querySelector('[data-plus]').addEventListener('click', () => {
        if (item.qty >= stock) {
          toast(`Only ${stock} unit(s) in stock`, 'error');
          return;
        }
        applyQty(item.qty + 1);
      });

      row.querySelector('[data-qty]').addEventListener('change', (e) => {
        let q = parseInt(e.target.value, 10);
        if (Number.isNaN(q) || q < 1) q = 1;
        if (q > stock) {
          q = stock;
          toast(`Quantity capped at stock level (${stock})`, 'info');
        }
        applyQty(q);
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
    checking = true;
    const items = cart.items();
    if (items.length) render(); // show the disabled "checking" state right away
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
    checking = false;
    render();
  }

  document.addEventListener('DOMContentLoaded', () => {
    UI.mountNav();
    UI.mountFooter();
    if (!UI.requireLogin()) return; // shop is only reachable after login
    const buyAll = $('buy-all-btn');
    if (buyAll) buyAll.addEventListener('click', placeOrder);
    render();
    checkAvailability(); // async — re-renders with live database state
    document.addEventListener('cart:changed', render);
    if (authStore.isLoggedIn) authStore.refresh();
  });
})();
