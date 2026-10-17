/**
 * Cart page: renders local cart, quantity controls, removal,
 * subtotal / delivery / total preview (server re-validates at checkout).
 */
(() => {
  const FREE_THRESHOLD = 499;
  const FLAT_DELIVERY = 49;

  const $ = (id) => document.getElementById(id);

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
      const row = document.createElement('div');
      row.className = 'cart-item';
      row.innerHTML = `
        <a href="/pages/product-details.html?id=${item.id}">
          <img class="cart-item__img" src="${UI.esc(item.image)}" alt="${UI.esc(item.name)}" />
        </a>
        <div>
          <div class="cart-item__name"><a href="/pages/product-details.html?id=${item.id}">${UI.esc(item.name)}</a></div>
          <div class="cart-item__meta">${UI.esc(item.category || '')} · ${UI.esc(item.packSize)} · ${UI.inr(item.price)} each</div>
          <button class="cart-item__remove" type="button" data-remove>Remove</button>
        </div>
        <div class="cart-item__right">
          <div class="qty">
            <button type="button" data-minus aria-label="Decrease">−</button>
            <input type="number" value="${item.qty}" min="1" max="${item.stock || 999}" data-qty aria-label="Quantity" />
            <button type="button" data-plus aria-label="Increase">+</button>
          </div>
          <span class="price">${UI.inr(item.price * item.qty)}</span>
        </div>`;

      row.querySelector('[data-remove]').addEventListener('click', () => {
        cart.remove(item.id);
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
        const stock = item.stock || 999;
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
        const stock = item.stock || 999;
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
  }

  document.addEventListener('DOMContentLoaded', () => {
    UI.mountNav();
    UI.mountFooter();
    if (!UI.requireLogin()) return; // shop is only reachable after login
    render();
    document.addEventListener('cart:changed', render);
    if (authStore.isLoggedIn) authStore.refresh();
  });
})();
