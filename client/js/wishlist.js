/**
 * Wishlist page: list saved products with live availability,
 * remove items and move available items to the cart.
 */
(() => {
  const $ = (id) => document.getElementById(id);

  function setLocalWishlist(ids) {
    if (authStore.user) {
      authStore.user.wishlist = ids;
      localStorage.setItem('agroshield_user', JSON.stringify(authStore.user));
    }
  }

  function card(p) {
    const d = document.createElement('article');
    d.className = 'p-card';
    const available = p.available !== false;
    const stockCls = !available ? 'out' : p.stockStatus === 'low' ? 'low' : 'in';
    const stockTxt = !available
      ? p.stockStatus === 'unavailable'
        ? 'Unavailable'
        : 'Out of Stock'
      : p.stockStatus === 'low'
        ? `Low Stock · ${p.stockQuantity} left`
        : 'In Stock';

    d.innerHTML = `
      <div class="p-card__media">
        <div class="p-card__flags">
          ${p.discountPercent > 0 ? `<span class="badge badge--red">${p.discountPercent}% off</span>` : ''}
          ${!available ? '<span class="badge badge--red">Out of Stock</span>' : ''}
        </div>
        <button class="p-card__wish on" type="button" aria-label="Remove from wishlist" data-remove>${I.heart}</button>
        <a href="/pages/product-details.html?id=${p._id}"><img src="${UI.esc(p.image)}" alt="${UI.esc(p.name)}" loading="lazy" /></a>
      </div>
      <div class="p-card__body">
        <span class="p-card__cat">${UI.esc(TAXONOMY.labelFor(p))}</span>
        <h3 class="p-card__name"><a href="/pages/product-details.html?id=${p._id}">${UI.esc(p.name)}</a></h3>
        <div class="p-card__meta">
          <span>${UI.esc(p.packSize)}</span>
          <span class="p-card__stock ${stockCls}"><span class="dot"></span>${stockTxt}</span>
        </div>
        <div class="p-card__price-row">
          <span class="price">${UI.inr(p.price)}</span>
          ${p.discountPercent > 0 ? `<span class="price-old">${UI.inr(p.mrp)}</span>` : ''}
        </div>
      </div>
      <div class="p-card__actions">
        <button class="btn btn--primary" type="button" data-move ${available ? '' : 'disabled'}>
          ${available ? 'Move to Cart' : 'Out of Stock'}
        </button>
        <button class="btn btn--ghost btn--sm" type="button" data-remove-text>Remove</button>
      </div>`;

    const remove = async () => {
      try {
        await api.del(`/wishlist/${p._id}`);
        const ids = (authStore.user.wishlist || []).filter((id) => id !== p._id);
        setLocalWishlist(ids);
        d.remove();
        toast('Removed from wishlist', 'info');
        UI.refreshBadges();
        if (!$('wishlist-grid').children.length) showEmpty();
      } catch (err) {
        toast(err.message, 'error');
      }
    };

    d.querySelector('[data-remove]').addEventListener('click', remove);
    d.querySelector('[data-remove-text]').addEventListener('click', remove);

    d.querySelector('[data-move]').addEventListener('click', () => {
      if (!available) return;
      cart.add(UI.cartLine(p), 1);
      UI.refreshBadges();
      toast(`${p.name} added to cart`);
      remove();
    });

    return d;
  }

  function showEmpty() {
    $('loader').classList.add('hidden');
    $('wishlist-grid').classList.add('hidden');
    $('wishlist-empty').classList.remove('hidden');
  }

  async function load() {
    try {
      const data = await api.get('/wishlist');
      $('loader').classList.add('hidden');
      const grid = $('wishlist-grid');
      const items = data.wishlist || [];
      if (!items.length) {
        showEmpty();
        return;
      }
      grid.classList.remove('hidden');
      grid.innerHTML = '';
      items.forEach((p) => grid.appendChild(card(p)));
      // keep local cache in sync with what the server returned
      setLocalWishlist(items.map((p) => p._id));
      UI.refreshBadges();
    } catch (err) {
      $('loader').classList.add('hidden');
      $('wishlist-grid').classList.remove('hidden');
      $('wishlist-grid').innerHTML = `<div class="alert show alert--error">${UI.esc(err.message)}</div>`;
    }
  }

  document.addEventListener('DOMContentLoaded', async () => {
    UI.mountNav();
    UI.mountFooter();
    if (!UI.requireLogin()) return; // shop is only reachable after login
    if (authStore.isLoggedIn) await authStore.refresh();
    await load();
    UI.refreshBadges();
  });
})();
