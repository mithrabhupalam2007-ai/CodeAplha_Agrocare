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
    $('pay-block').innerHTML = `${methodLabels[order.paymentMethod] || UI.esc(order.paymentMethod)}<br/>Payment status: <b>${statusLabels[order.paymentStatus] || UI.esc(order.paymentStatus)}</b><br/>Ordered on ${UI.formatDate(order.createdAt)}`;

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
  });
})();
