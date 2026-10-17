/**
 * Checkout: prefills the saved address, validates the form client-side,
 * then POSTs only { items: [{product, quantity}], shippingAddress, paymentMethod }.
 * The server owns pricing, stock and totals.
 */
(() => {
  const FREE_THRESHOLD = 499;
  const FLAT_DELIVERY = 49;
  const $ = (id) => document.getElementById(id);

  /* ---------------- summary ---------------- */
  function renderSummary() {
    const items = cart.items();
    if (!items.length) return false;

    $('summary-items').innerHTML = items
      .map(
        (i) => `
      <div class="mini-item">
        <img src="${UI.esc(i.image)}" alt="" />
        <span class="grow">
          <span class="nm">${UI.esc(i.name)}</span>
          <span class="qt">${i.qty} × ${UI.esc(i.packSize)} · ${UI.inr(i.price)}</span>
        </span>
        <span class="pr">${UI.inr(i.price * i.qty)}</span>
      </div>`
      )
      .join('');

    const subtotal = cart.subtotal();
    const delivery = subtotal >= FREE_THRESHOLD ? 0 : FLAT_DELIVERY;
    $('c-subtotal').textContent = UI.inr(subtotal);
    $('c-delivery').textContent = delivery === 0 ? 'FREE' : UI.inr(delivery);
    $('c-total').textContent = UI.inr(subtotal + delivery);
    $('c-note').textContent =
      subtotal >= FREE_THRESHOLD
        ? 'Free delivery applied. Server will re-verify prices and stock.'
        : `Includes ${UI.inr(FLAT_DELIVERY)} delivery. Server will re-verify prices and stock.`;
    return true;
  }

  /* ---------------- validation ---------------- */
  const validators = {
    name: (v) => (v.trim().length >= 2 ? '' : 'Please enter your full name (min 2 characters).'),
    phone: (v) => (/^[6-9]\d{9}$/.test(v.trim()) ? '' : 'Enter a valid 10-digit Indian mobile number.'),
    line1: (v) => (v.trim().length >= 3 ? '' : 'Address line is required (min 3 characters).'),
    city: (v) => (v.trim().length >= 2 ? '' : 'City is required.'),
    state: (v) => (v.trim().length >= 2 ? '' : 'State is required.'),
    pincode: (v) => (/^\d{6}$/.test(v.trim()) ? '' : 'PIN code must be exactly 6 digits.'),
  };

  function showError(field, msg) {
    const input = document.querySelector(`[name="${field}"]`);
    const err = document.querySelector(`[data-err="${field}"]`);
    if (input) input.classList.toggle('input--error', Boolean(msg));
    if (err) {
      err.textContent = msg;
      err.classList.toggle('show', Boolean(msg));
    }
  }

  function validateField(field) {
    const input = document.querySelector(`[name="${field}"]`);
    if (!input || !validators[field]) return true;
    const msg = validators[field](input.value);
    showError(field, msg);
    return !msg;
  }

  function validateAll() {
    return Object.keys(validators).map(validateField).every(Boolean);
  }

  function flashError(message) {
    const box = $('checkout-error');
    box.textContent = message;
    box.classList.add('show');
    delete box.dataset.blocked; // a server flash is not the blocked-state markup
    box.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  /* ---------------- live availability pre-check ----------------
   * Before the order is placed, every cart line is verified against the
   * database (product still active, not manually blocked, stock sufficient).
   * The server performs the same checks again during the POST — this is only
   * a friendly early warning so the customer is never surprised at submit.
   * ------------------------------------------------------------- */
  const liveIssues = [];

  function applyPlaceOrderState() {
    const btn = $('place-order');
    const box = $('checkout-error');
    if (!btn) return;
    if (liveIssues.length) {
      btn.disabled = true;
      btn.classList.add('is-disabled');
      box.innerHTML = `<strong>Checkout blocked</strong><br>${liveIssues
        .map((i) => UI.esc(i))
        .join('<br>')}<br><a href="/pages/cart.html">Return to your cart</a>`;
      box.classList.add('show');
      box.dataset.blocked = '1';
    } else {
      btn.disabled = false;
      btn.classList.remove('is-disabled');
      if (box.dataset.blocked) {
        box.classList.remove('show');
        box.textContent = '';
        delete box.dataset.blocked;
      }
    }
  }

  async function verifyCart() {
    liveIssues.length = 0;
    const items = cart.items();
    await Promise.all(
      items.map(async (item) => {
        try {
          const data = await api.get(`/products/${item.id}`);
          const p = data.product;
          if (p.available === false) {
            liveIssues.push(
              p.stockStatus === 'unavailable'
                ? `"${p.name}" is no longer available.`
                : `"${p.name}" is out of stock.`
            );
          } else if (item.qty > p.stockQuantity) {
            liveIssues.push(`Only ${p.stockQuantity} unit(s) of "${p.name}" are in stock.`);
          }
          // keep the local summary in sync with current database prices
          const patch = {};
          if (Number.isFinite(p.price) && p.price !== item.price) patch.price = p.price;
          if (typeof p.stockQuantity === 'number' && p.stockQuantity !== item.stock)
            patch.stock = p.stockQuantity;
          if (Object.keys(patch).length) cart.patch(item.id, patch);
        } catch (err) {
          liveIssues.push(`A product in your cart is no longer available. Please return to your cart.`);
        }
      })
    );
    renderSummary();
    applyPlaceOrderState();
    return liveIssues.length === 0;
  }

  /* ---------------- prefill ---------------- */
  function prefill() {
    const user = authStore.user;
    if (!user) return;
    $('c-name').value = user.name || '';
    $('c-phone').value = user.phone || '';
    const a = user.address || {};
    $('c-line1').value = a.line1 || '';
    $('c-line2').value = a.line2 || '';
    $('c-city').value = a.city || '';
    $('c-state').value = a.state || '';
    $('c-pincode').value = a.pincode || '';
  }

  /* ---------------- submit ---------------- */
  async function submit(e) {
    e.preventDefault();
    $('checkout-error').classList.remove('show');

    if (!validateAll()) {
      toast('Please fix the highlighted fields.', 'error');
      const firstBad = document.querySelector('.input--error');
      if (firstBad) firstBad.focus();
      return;
    }

    // Final availability re-check (the server enforces the same rules).
    const btn = $('place-order');
    btn.disabled = true;
    $('placing').classList.remove('hidden');
    const ok = await verifyCart();
    if (!ok) {
      $('placing').classList.add('hidden');
      btn.disabled = true; // stays blocked until the cart is fixed
      toast('Some items in your cart are unavailable. Please review your cart.', 'error');
      return;
    }

    const payload = {
      items: cart.toPayload(),
      paymentMethod: document.querySelector('input[name="payment"]:checked').value,
      shippingAddress: {
        fullName: $('c-name').value.trim(),
        phone: $('c-phone').value.trim(),
        line1: $('c-line1').value.trim(),
        line2: $('c-line2').value.trim(),
        city: $('c-city').value.trim(),
        state: $('c-state').value.trim(),
        pincode: $('c-pincode').value.trim(),
      },
    };

    try {
      const data = await api.post('/orders', payload);

      // Clear only the items that were purchased (server echoes their ids).
      const bought = new Set(data.cartItemIds || []);
      cart.items()
        .filter((i) => bought.has(i.id))
        .forEach((i) => cart.remove(i.id));
      UI.refreshBadges();

      toast('Order placed successfully!');
      location.href = `/pages/order-confirmation.html?id=${encodeURIComponent(data.order.orderId)}`;
    } catch (err) {
      if (err.status === 401) {
        toast('Please log in to place an order.', 'error');
        setTimeout(
          () =>
            (location.href =
              '/pages/login.html?next=' + encodeURIComponent('/pages/checkout.html')),
          1200
        );
        return;
      }
      flashError(err.message);
      toast(err.message, 'error');
      if (err.status === 409) verifyCart(); // refresh the blocked state
    } finally {
      // stay blocked (greyed out) while known issues remain in the cart
      btn.disabled = liveIssues.length > 0;
      btn.classList.toggle('is-disabled', liveIssues.length > 0);
      $('placing').classList.add('hidden');
    }
  }

  document.addEventListener('DOMContentLoaded', async () => {
    UI.mountNav();
    UI.mountFooter();
    if (!UI.requireLogin()) return; // shop is only reachable after login

    const hasItems = renderSummary();
    if (!hasItems) {
      $('checkout-form').classList.add('hidden');
      $('checkout-empty').classList.remove('hidden');
      return;
    }

    // Checkout requires a logged-in customer.
    if (!UI.requireLogin()) return;
    const user = await authStore.refresh();
    if (!user) return; // redirect handled by requireLogin on next pass
    if (user.role === 'admin') {
      // admins may still order; nothing to block
    }
    prefill();
    UI.refreshBadges();

    verifyCart(); // async — blocks the submit button if anything is unavailable

    Object.keys(validators).forEach((field) => {
      const input = document.querySelector(`[name="${field}"]`);
      if (input) input.addEventListener('blur', () => validateField(field));
    });

    document.querySelectorAll('[data-pay]').forEach((label) => {
      label.addEventListener('click', () => {
        document.querySelectorAll('[data-pay]').forEach((l) => l.classList.remove('selected'));
        label.classList.add('selected');
      });
    });

    $('checkout-form').addEventListener('submit', submit);
  });
})();
