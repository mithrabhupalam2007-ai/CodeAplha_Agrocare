/**
 * Order confirmation: fetches the placed order by its readable order id
 * (ownership enforced server-side) and renders the receipt.
 */
(() => {
  const $ = (id) => document.getElementById(id);

  document.addEventListener('DOMContentLoaded', async () => {
    UI.mountNav();
    UI.mountFooter();

    const orderId = new URLSearchParams(location.search).get('id');
    if (!orderId || !authStore.isLoggedIn) {
      $('loader').classList.add('hidden');
      $('not-found').classList.remove('hidden');
      return;
    }

    let order;
    try {
      const data = await api.get(`/orders/${encodeURIComponent(orderId)}`);
      order = data.order;
    } catch (err) {
      $('loader').classList.add('hidden');
      $('not-found').classList.remove('hidden');
      return;
    }

    $('loader').classList.add('hidden');
    $('confirm-root').classList.remove('hidden');
    document.title = `Order ${order.orderId} Confirmed — AgroShield`;

    $('order-id').textContent = order.orderId;

    const a = order.shippingAddress;
    $('addr-block').innerHTML = `${UI.esc(a.fullName)}<br/>${UI.esc(a.line1)}${a.line2 ? ', ' + UI.esc(a.line2) : ''}<br/>${UI.esc(a.city)}, ${UI.esc(a.state)} — ${UI.esc(a.pincode)}<br/>📞 ${UI.esc(a.phone)}`;

    const methodLabels = {
      cod: '💵 Cash on Delivery (pay on arrival)',
      demo: '🧪 Demo checkout — no real payment was processed',
    };
    const statusLabels = {
      pending: 'Pending (pay on delivery)',
      paid: order.paymentMethod === 'demo' ? 'Paid — demo transaction only' : 'Paid',
      failed: 'Failed',
      refunded: 'Refunded',
    };
    $('pay-block').innerHTML = `${methodLabels[order.paymentMethod] || UI.esc(order.paymentMethod)}<br/>Payment status: <b>${statusLabels[order.paymentStatus] || UI.esc(order.paymentStatus)}</b><br/>Ordered on ${UI.formatDateTime(order.createdAt)}`;

    $('order-items').innerHTML = order.items
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
      .join('');

    $('o-subtotal').textContent = UI.inr(order.subtotal);
    $('o-delivery').textContent = order.deliveryCharges === 0 ? 'FREE' : UI.inr(order.deliveryCharges);
    $('o-total').textContent = UI.inr(order.total);
    $('o-status').textContent = order.orderStatus;

    /* ---- hero stats: product count, highlighted total, date+time, payment ---- */
    const productCount = order.items.length;
    $('o-count').textContent = `${productCount} product${productCount === 1 ? '' : 's'}`;
    $('o-total-hl').textContent = UI.inr(order.total);
    $('o-datetime').textContent = UI.formatDateTime(order.createdAt);
    $('o-pay-status').textContent = statusLabels[order.paymentStatus] || UI.esc(order.paymentStatus);

    /* ---- celebratory confetti burst (skipped for reduced-motion users) ---- */
    burstConfetti();
  });

  /**
   * One-shot green/beige/white confetti burst from behind the success tick.
   * Pure CSS animation via --dx/--dy/--r custom properties; honour the
   * visitor's prefers-reduced-motion setting (nothing is shown then).
   */
  function burstConfetti() {
    const wrap = document.getElementById('confetti');
    if (!wrap) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const colors = ['var(--green-700)', 'var(--green-500)', 'var(--beige-200)', '#ffffff'];
    const shapes = ['', 'confetti-bit--dot', 'confetti-bit--bar'];
    const total = 42;
    for (let i = 0; i < total; i += 1) {
      const bit = document.createElement('i');
      bit.className = `confetti-bit ${shapes[i % shapes.length]}`;
      const angle = (Math.PI * 2 * i) / total + (Math.random() * 0.6 - 0.3);
      const dist = 120 + Math.random() * 170;
      bit.style.setProperty('--dx', `${Math.round(Math.cos(angle) * dist)}px`);
      bit.style.setProperty('--dy', `${Math.round(Math.sin(angle) * dist - 40)}px`);
      bit.style.setProperty('--r', `${Math.round(Math.random() * 720 - 360)}deg`);
      bit.style.setProperty('--c', colors[i % colors.length]);
      bit.style.animationDelay = `${(Math.random() * 0.2).toFixed(2)}s`;
      wrap.appendChild(bit);
    }
    // clean up the finished animation so it can replay on re-entry
    setTimeout(() => { wrap.innerHTML = ''; }, 2200);
  }
})();
