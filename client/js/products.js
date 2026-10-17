/**
 * Product catalogue: URL-driven search / filters / sort / pagination.
 * Every query hits GET /api/products — nothing is hardcoded client-side.
 */
(() => {
  const grid = document.getElementById('product-grid');
  const emptyState = document.getElementById('empty-state');
  const countEl = document.getElementById('result-count');
  const loadMoreBtn = document.getElementById('load-more');

  /** Current filter state, hydrated from the URL on load. */
  const state = {
    q: '',
    type: '',
    category: '',
    crop: '',
    min: '',
    max: '',
    inStock: false,
    sort: 'featured',
    page: 1,
    limit: 12,
  };

  let isLoading = false;

  /* ---------------- URL <-> state ---------------- */
  function hydrateFromURL() {
    const u = new URLSearchParams(location.search);
    state.q = u.get('q') || '';
    state.type = u.get('type') || '';
    state.category = u.get('category') || '';
    state.crop = u.get('crop') || '';
    state.min = u.get('min') || '';
    state.max = u.get('max') || '';
    state.inStock = u.get('inStock') === 'true';
    state.sort = u.get('sort') || 'featured';
    state.page = Math.max(1, parseInt(u.get('page'), 10) || 1);
  }

  function pushURL(replace = false) {
    const u = new URLSearchParams();
    if (state.q) u.set('q', state.q);
    if (state.type) u.set('type', state.type);
    if (state.category) u.set('category', state.category);
    if (state.crop) u.set('crop', state.crop);
    if (state.min) u.set('min', state.min);
    if (state.max) u.set('max', state.max);
    if (state.inStock) u.set('inStock', 'true');
    if (state.sort !== 'featured') u.set('sort', state.sort);
    if (state.page > 1) u.set('page', state.page);
    const url = `${location.pathname}${u.toString() ? '?' + u.toString() : ''}`;
    history[replace ? 'replaceState' : 'pushState']({}, '', url);
  }

  /* ---------------- form <-> state ---------------- */
  const el = (id) => document.getElementById(id);

  function syncFormFromState() {
    el('f-search').value = state.q;
    el('f-category').value = state.category;
    el('f-crop').value = state.crop;
    el('f-min').value = state.min;
    el('f-max').value = state.max;
    el('f-stock').checked = state.inStock;
    el('f-sort').value = state.sort;
    document.querySelectorAll('#type-chips .chip').forEach((c) => {
      c.classList.toggle('active', (c.dataset.type || '') === state.type);
    });
    const titles = {
      Seeds: ['Seeds', 'Vegetable, fruit and field-crop seeds with variety and sowing information.'],
      Pesticides: ['Pesticides', 'Crop protection listings with clearly labelled demo label information.'],
      Fertilizers: ['Fertilizers', 'Organic manures, NPK blends and micronutrients for every soil type.'],
      'Farming Essentials': ['Farming Essentials', 'Tools, sprayers and safety equipment for the field and farm.'],
    };
    const [t, s] = titles[state.type] || ['All Products', 'Fresh from the store database — search, filter and find what your crop needs.'];
    document.getElementById('page-title').textContent = state.category || (state.q ? `Search: “${state.q}”` : t);
    document.getElementById('page-sub').textContent = s;
  }

  function readFormIntoState() {
    state.q = el('f-search').value.trim();
    state.category = el('f-category').value;
    state.crop = el('f-crop').value;
    state.min = el('f-min').value;
    state.max = el('f-max').value;
    state.inStock = el('f-stock').checked;
    state.sort = el('f-sort').value;
  }

  /* ---------------- rendering ---------------- */
  function card(p) {
    const d = document.createElement('article');
    d.className = 'p-card';
    // Backend is the source of truth for availability:
    // available = active AND stock > 0 AND manualOutOfStock === false
    const available = p.available !== false;
    const stockCls = !available ? 'out' : p.stockStatus === 'low' ? 'low' : 'in';
    const stockTxt = !available
      ? p.stockStatus === 'unavailable'
        ? 'Unavailable'
        : 'Out of Stock'
      : p.stockStatus === 'low'
        ? `Low Stock · ${p.stockQuantity} left`
        : 'In Stock';
    const wished = ((authStore.user && authStore.user.wishlist) || []).includes(p._id);

    d.innerHTML = `
      <div class="p-card__media">
        <div class="p-card__flags">
          ${p.isNewRelease ? '<span class="badge badge--green">New</span>' : ''}
          ${p.bestseller ? '<span class="badge badge--amber">Bestseller</span>' : ''}
          ${p.featured ? '<span class="badge badge--green">Featured</span>' : ''}
          ${p.discountPercent > 0 ? `<span class="badge badge--red">${p.discountPercent}% off</span>` : ''}
          ${!available ? '<span class="badge badge--red">Out of Stock</span>' : ''}
        </div>
        <button class="p-card__wish ${wished ? 'on' : ''}" type="button" aria-label="Toggle wishlist" data-wish>${I.heart}</button>
        <a href="/pages/product-details.html?id=${p._id}"><img src="${UI.esc(p.image)}" alt="${UI.esc(p.name)}" loading="lazy" /></a>
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

    d.querySelector('[data-add]').addEventListener('click', () => {
      if (!available) return;
      cart.add(UI.cartLine(p), 1);
      UI.refreshBadges();
      toast(`${p.name} added to cart`);
    });

    d.querySelector('[data-wish]').addEventListener('click', async (e) => {
      if (!UI.requireLogin()) return;
      const btn = e.currentTarget;
      const on = btn.classList.contains('on');
      try {
        if (on) {
          await api.del(`/users/wishlist/${p._id}`);
          btn.classList.remove('on');
          authStore.user.wishlist = (authStore.user.wishlist || []).filter((id) => id !== p._id);
          toast('Removed from wishlist', 'info');
        } else {
          await api.post(`/users/wishlist/${p._id}`);
          btn.classList.add('on');
          authStore.user.wishlist = [...new Set([...(authStore.user.wishlist || []), p._id])];
          toast('Added to wishlist');
        }
        localStorage.setItem('agroshield_user', JSON.stringify(authStore.user));
        UI.refreshBadges();
      } catch (err) {
        toast(err.message, 'error');
      }
    });

    return d;
  }

  /* ---------------- fetching ---------------- */
  async function fetchProducts({ append = false } = {}) {
    if (isLoading) return;
    isLoading = true;

    if (!append) {
      grid.innerHTML = '<div class="skeleton skeleton-card"></div>'.repeat(6);
      emptyState.classList.add('hidden');
    }
    loadMoreBtn.classList.add('hidden');

    try {
      const data = await api.get(
        '/products' +
          api.qs({
            search: state.q,
            type: state.type,
            category: state.category,
            crop: state.crop,
            minPrice: state.min,
            maxPrice: state.max,
            inStock: state.inStock ? 'true' : '',
            sort: state.sort,
            page: state.page,
            limit: state.limit,
          })
      );

      const { products, pagination } = data;

      if (!append) grid.innerHTML = '';
      if (!products.length && !append) {
        emptyState.classList.remove('hidden');
        countEl.textContent = '0 products found';
      } else {
        const frag = document.createDocumentFragment();
        products.forEach((p) => frag.appendChild(card(p)));
        grid.appendChild(frag);
        const from = (pagination.page - 1) * pagination.limit + 1;
        const to = from + products.length - 1;
        countEl.innerHTML = `<b>${pagination.total}</b> product${pagination.total === 1 ? '' : 's'} found${
          pagination.total ? ` · showing ${from}–${to}` : ''
        }`;
      }

      if (pagination.hasNext) loadMoreBtn.classList.remove('hidden');
      loadMoreBtn.textContent = 'Load more products';
    } catch (err) {
      grid.innerHTML = `<div class="alert show alert--error" style="grid-column:1/-1;">${UI.esc(err.message)}</div>`;
      countEl.textContent = '';
    } finally {
      isLoading = false;
    }
  }

  /* ---------------- filter option loading ---------------- */
  async function loadFilterOptions() {
    try {
      const [cats, cropsData] = await Promise.all([
        api.get('/categories'),
        api.get('/products' + api.qs({ limit: 48 })),
      ]);

      const catSel = el('f-category');
      cats.categories.forEach((c) => {
        const o = document.createElement('option');
        o.value = c.name;
        o.textContent = `${c.name} (${c.productCount})`;
        catSel.appendChild(o);
      });

      const crops = new Set();
      cropsData.products.forEach((p) => (p.crops || []).forEach((c) => crops.add(c)));
      const cropSel = el('f-crop');
      [...crops].sort().forEach((c) => {
        const o = document.createElement('option');
        o.value = c;
        o.textContent = c;
        cropSel.appendChild(o);
      });
    } catch (err) {
      /* filter options are non-critical; the list itself still loads */
      console.warn('filter options failed:', err.message);
    }
  }

  function applyAndReset() {
    readFormIntoState();
    state.page = 1;
    pushURL();
    syncFormFromState();
    fetchProducts();
  }

  function clearFilters() {
    Object.assign(state, {
      q: '', type: '', category: '', crop: '', min: '', max: '',
      inStock: false, sort: 'featured', page: 1,
    });
    pushURL();
    syncFormFromState();
    fetchProducts();
    toast('Filters cleared', 'info');
  }

  /* ---------------- wiring ---------------- */
  document.addEventListener('DOMContentLoaded', async () => {
    UI.mountNav();
    UI.mountFooter();
    if (!UI.requireLogin()) return; // shop is only reachable after login

    hydrateFromURL();
    syncFormFromState();
    loadFilterOptions();
    fetchProducts();

    el('apply-filters').addEventListener('click', applyAndReset);
    el('clear-filters').addEventListener('click', clearFilters);
    el('empty-clear').addEventListener('click', clearFilters);

    // Enter key inside search applies immediately
    el('f-search').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') applyAndReset();
    });

    el('f-sort').addEventListener('change', applyAndReset);

    document.querySelectorAll('#type-chips .chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        state.type = chip.dataset.type || '';
        state.category = '';
        state.page = 1;
        pushURL();
        syncFormFromState();
        fetchProducts();
      });
    });

    loadMoreBtn.addEventListener('click', () => {
      state.page += 1;
      pushURL(true);
      fetchProducts({ append: true });
    });

    el('filter-toggle').addEventListener('click', () => {
      el('filters').classList.toggle('open');
    });

    // Browser back/forward restores the previous result set
    window.addEventListener('popstate', () => {
      hydrateFromURL();
      syncFormFromState();
      fetchProducts();
    });

    if (authStore.isLoggedIn) await authStore.refresh();
    UI.refreshBadges();
  });
})();
