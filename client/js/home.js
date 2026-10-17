/**
 * Home page: category cards, featured / seed / seasonal product rails,
 * newsletter subscription.
 */
(() => {
  /* Build a product card element shared by every home-page rail. */
  function productCard(p) {
    const el = article('p-card');
    // Availability comes from the backend (active AND stock > 0 AND not
    // manually blocked) — never re-derived in the browser.
    const available = p.available !== false;
    const stockCls = !available ? 'out' : p.stockStatus === 'low' ? 'low' : 'in';
    const stockTxt = !available
      ? p.stockStatus === 'unavailable' ? 'Unavailable' : 'Out of Stock'
      : p.stockStatus === 'low' ? `Low Stock · ${p.stockQuantity} left` : 'In Stock';
    const inWishlist = ((authStore.user && authStore.user.wishlist) || []).includes(p._id);

    el.innerHTML = `
      <div class="p-card__media">
        <div class="p-card__flags">
          ${p.isNewRelease ? '<span class="badge badge--green">New</span>' : ''}
          ${p.bestseller ? '<span class="badge badge--amber">Bestseller</span>' : ''}
          ${p.featured ? '<span class="badge badge--green">Featured</span>' : ''}
          ${p.discountPercent > 0 ? `<span class="badge badge--red">${p.discountPercent}% off</span>` : ''}
          ${!available ? '<span class="badge badge--red">Out of Stock</span>' : ''}
        </div>
        <button class="p-card__wish ${inWishlist ? 'on' : ''}" type="button" aria-label="Add to wishlist" data-wish>${I.heart}</button>
        <a href="/pages/product-details.html?id=${p._id}">
          <img src="${UI.esc(p.image)}" alt="${UI.esc(p.name)}" loading="lazy" />
        </a>
      </div>
      <div class="p-card__body">
        <span class="p-card__cat">${UI.esc(p.category)}</span>
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
        <button class="btn btn--primary" type="button" data-add ${available ? '' : 'disabled'}>
          ${available ? 'Add to Cart' : 'Out of Stock'}
        </button>
        <a class="btn btn--ghost btn--sm" href="/pages/product-details.html?id=${p._id}">Details</a>
      </div>`;

    el.querySelector('[data-add]').addEventListener('click', () => {
      if (!available) return;
      cart.add(UI.cartLine(p), 1);
      UI.refreshBadges();
      toast(`${p.name} added to cart`);
    });

    el.querySelector('[data-wish]').addEventListener('click', (e) => toggleWishlist(p, e.currentTarget));
    return el;
  }

  function article(cls) {
    const d = document.createElement('article');
    d.className = cls;
    return d;
  }

  /** Wishlist requires a login; keeps server + badge in sync. */
  async function toggleWishlist(product, btn) {
    if (!UI.requireLogin()) return;
    const isOn = btn.classList.contains('on');
    try {
      if (isOn) {
        await api.del(`/users/wishlist/${product._id}`);
        btn.classList.remove('on');
        authStore.user.wishlist = (authStore.user.wishlist || []).filter((id) => id !== product._id);
        toast('Removed from wishlist', 'info');
      } else {
        await api.post(`/users/wishlist/${product._id}`);
        btn.classList.add('on');
        authStore.user.wishlist = [...new Set([...(authStore.user.wishlist || []), product._id])];
        toast('Added to wishlist');
      }
      localStorage.setItem('agroshield_user', JSON.stringify(authStore.user));
      UI.refreshBadges();
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  function skeleton(container) {
    container.innerHTML = '<div class="skeleton skeleton-card"></div>'.repeat(4);
  }

  async function loadProducts(gridId, params) {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    skeleton(grid);
    try {
      const data = await api.get(`/products${api.qs(params)}`);
      grid.innerHTML = '';
      if (!data.products.length) {
        grid.innerHTML = '<p class="text-muted">No products found in this section yet.</p>';
        return;
      }
      data.products.forEach((p) => grid.appendChild(productCard(p)));
    } catch (err) {
      grid.innerHTML = `<div class="alert show alert--error">${UI.esc(err.message)}</div>`;
    }
  }

  async function loadCategories() {
    const grid = document.getElementById('category-grid');
    if (!grid) return;
    grid.innerHTML = '<div class="skeleton skeleton-card"></div>'.repeat(6);
    try {
      const data = await api.get('/categories');
      grid.innerHTML = '';
      data.categories.forEach((c) => {
        const a = document.createElement('a');
        a.className = 'cat-card';
        a.href = `/pages/products.html?category=${encodeURIComponent(c.name)}`;
        a.innerHTML = `
          <img class="cat-card__img" src="${UI.esc(c.image)}" alt="${UI.esc(c.name)}" loading="lazy" />
          <div class="cat-card__body">
            <h3>${UI.esc(c.name)}</h3>
            <p>${c.productCount} product${c.productCount === 1 ? '' : 's'}</p>
          </div>
          <span class="cat-card__go">${I.arrow}</span>`;
        grid.appendChild(a);
      });
    } catch (err) {
      grid.innerHTML = `<div class="alert show alert--error">${UI.esc(err.message)}</div>`;
    }
  }

  function wireNewsletter() {
    const form = document.getElementById('newsletter-form');
    if (!form) return;
    const msg = document.getElementById('newsletter-msg');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = form.email.value.trim();
      msg.textContent = 'Subscribing...';
      try {
        const data = await api.post('/newsletter', { email });
        msg.textContent = data.message;
        form.reset();
        toast(data.message);
      } catch (err) {
        msg.textContent = err.message;
        toast(err.message, 'error');
      }
    });
  }

  /** New Releases uses its dedicated endpoint (isNewRelease flag + releaseDate). */
  async function loadNewReleases() {
    const grid = document.getElementById('new-releases-grid');
    if (!grid) return;
    skeleton(grid);
    try {
      const data = await api.get('/products/new-releases?limit=8');
      grid.innerHTML = '';
      if (!data.products.length) {
        grid.innerHTML =
          '<div class="empty-state"><p>No new products have been released yet. Check back soon!</p><a class="btn btn--primary btn--sm" href="/pages/products.html">Browse all products</a></div>';
        return;
      }
      data.products.forEach((p) => grid.appendChild(productCard(p)));
    } catch (err) {
      grid.innerHTML = `<div class="alert show alert--error">${UI.esc(err.message)}</div>`;
    }
  }

  document.addEventListener('DOMContentLoaded', async () => {
    UI.mountNav();
    UI.mountFooter();
    if (!UI.requireLogin()) return; // shop is only reachable after login
    wireNewsletter();

    loadCategories();
    loadNewReleases();
    loadProducts('featured-grid', { featured: true, limit: 4, sort: 'featured' });
    loadProducts('seed-grid', { type: 'Seeds', bestseller: true, limit: 4, sort: 'rating' });
    loadProducts('crop-grid', { type: 'Pesticides', limit: 4, sort: 'rating' });
    loadProducts('recent-grid', { limit: 4, sort: 'newest' });
    loadProducts('essentials-grid', { type: 'Farming Essentials', limit: 4, sort: 'featured' });

    if (authStore.isLoggedIn) await authStore.refresh();
    UI.refreshBadges();
  });
})();
