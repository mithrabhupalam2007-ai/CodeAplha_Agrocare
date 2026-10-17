/**
 * Product details page: full product data, quantity picker, add to cart,
 * wishlist toggle and related products.
 */
(() => {
  let product = null;
  let related = [];

  const $ = (id) => document.getElementById(id);

  function currentQty() {
    const input = $('qty-input');
    const max = Math.max(1, product ? product.stockQuantity : 1);
    let n = parseInt(input.value, 10);
    if (Number.isNaN(n) || n < 1) n = 1;
    if (n > max) n = max;
    input.value = n;
    return n;
  }

  function renderSpecs() {
    const rows = [
      ['Brand / manufacturer', product.brand],
      ['Category', product.category],
      ['Product type', product.type],
      ['Pack size', product.packSize],
      ['Price', `${UI.inr(product.price)} per ${product.packSize}`],
      ['Stock', product.stockQuantity > 0 ? `${product.stockQuantity} units available` : 'Currently out of stock'],
      ...(product.crops && product.crops.length ? [['Approved crops / intended use', product.crops.join(', ') + ' (demo data)']] : []),
      ...(product.specifications || []).map((s) => [s.label, s.value]),
    ].filter(([, v]) => v);

    $('spec-body').innerHTML = rows
      .map(([k, v]) => `<tr><td>${UI.esc(k)}</td><td>${UI.esc(v)}</td></tr>`)
      .join('');
  }

  function renderSeedInfo() {
    const s = product.seedInfo || {};
    const has =
      product.type === 'Seeds' &&
      (s.variety || s.cropType || s.germinationPercent || s.sowingInstructions || s.daysToGerminate);
    if (!has) return;
    $('seed-panel').classList.remove('hidden');

    const rows = [];
    if (s.variety) rows.push(['Seed variety', s.variety]);
    if (s.cropType) rows.push(['Crop type', s.cropType]);
    if (s.germinationPercent) rows.push(['Germination', `${s.germinationPercent}% (demo claim, not lab verified)`]);
    if (s.daysToGerminate) rows.push(['Time to germination', s.daysToGermination]);
    if (s.sowingInstructions) rows.push(['Sowing instructions', s.sowingInstructions]);

    $('seed-body').innerHTML = rows
      .map(([k, v]) => `<tr><td>${UI.esc(k)}</td><td>${UI.esc(v)}</td></tr>`)
      .join('');
  }

  function renderLabelInfo() {
    if (product.type !== 'Pesticides') return;
    $('label-panel').classList.remove('hidden');

    const l = product.labelInfo || {};
    const rows = [
      ['Composition', l.composition],
      ['Registration details', l.registrationNo],
      ['Label instructions', l.labelInstructions],
      ['Safety precautions', l.safetyPrecautions],
      ['Storage', l.storage],
      ['Disposal guidance', l.disposal],
    ].filter(([, v]) => v);

    $('label-rows').innerHTML =
      (product.isDemoData
        ? `<div class="alert show alert--demo" style="margin-bottom:14px;">⚠ DEMO DATA — this is placeholder label content for development. Do not rely on it for dosage, application or safety. Always follow the label of the actual product you purchase, and verify registration/licensing requirements under applicable Indian law before real sales.</div>`
        : '') +
      `<table class="spec-table"><tbody>${rows
        .map(([k, v]) => `<tr><td>${UI.esc(k)}</td><td>${UI.esc(v)}</td></tr>`)
        .join('')}</tbody></table>`;
  }

  function renderBatch() {
    const b = product.batch || {};
    if (!b.batchNumber && !b.expiryDate) return;
    $('batch-panel').classList.remove('hidden');
    const rows = [];
    if (b.batchNumber) rows.push(['Batch number', b.batchNumber]);
    if (b.expiryDate) rows.push(['Expiry date', UI.formatDate(b.expiryDate)]);
    $('batch-body').innerHTML = rows
      .map(([k, v]) => `<tr><td>${UI.esc(k)}</td><td>${UI.esc(v)}</td></tr>`)
      .join('');
  }

  function relatedCard(p) {
    const d = document.createElement('article');
    d.className = 'p-card';
    d.innerHTML = `
      <div class="p-card__media">
        <a href="/pages/product-details.html?id=${p._id}"><img src="${UI.esc(p.image)}" alt="${UI.esc(p.name)}" loading="lazy" /></a>
      </div>
      <div class="p-card__body">
        <span class="p-card__cat">${UI.esc(p.category)}</span>
        <h3 class="p-card__name"><a href="/pages/product-details.html?id=${p._id}">${UI.esc(p.name)}</a></h3>
        <div class="p-card__meta"><span>${UI.esc(p.packSize)}</span></div>
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
    return d;
  }

  async function load() {
    const id = new URLSearchParams(location.search).get('id');
    if (!id) {
      $('loader').classList.add('hidden');
      $('not-found').classList.remove('hidden');
      return;
    }

    try {
      const data = await api.get(`/products/${id}`);
      product = data.product;
      related = data.related || [];
    } catch (err) {
      $('loader').classList.add('hidden');
      $('not-found').classList.remove('hidden');
      document.getElementById('head-title').textContent = 'Product not found';
      return;
    }

    $('loader').classList.add('hidden');
    $('pdp-root').classList.remove('hidden');

    document.title = `${product.name} — AgroShield`;
    $('head-title').textContent = product.name;
    $('head-sub').textContent = `${product.brand} · ${product.category} · ${product.packSize}`;
    $('crumb').innerHTML = `<a href="/">Home</a><span>/</span><a href="/pages/products.html">Products</a><span>/</span><a href="/pages/products.html?category=${encodeURIComponent(product.category)}">${UI.esc(product.category)}</a><span>/</span><span class="current">${UI.esc(product.name)}</span>`;

    $('pdp-image').src = product.image;
    $('pdp-image').alt = product.name;
    $('pdp-cat').textContent = product.category;
    $('pdp-name').textContent = product.name;
    $('pdp-stars').textContent = UI.stars(product.rating);
    $('pdp-reviews').textContent = `${product.rating || 0} · ${product.reviewCount || 0} demo reviews`;
    $('pdp-brand').textContent = product.brand;
    $('pdp-desc').textContent = product.description;
    $('pdp-price').textContent = UI.inr(product.price);
    $('pdp-pack').textContent = `per ${product.packSize}`;

    const stock = $('pdp-stock');
    if (product.stockQuantity <= 0) {
      stock.innerHTML = '<span class="dot"></span><span class="text-danger">Out of stock</span>';
      $('add-cart').disabled = true;
      $('qty-input').max = 1;
    } else if (product.stockQuantity <= 5) {
      stock.innerHTML = `<span class="dot"></span><span style="color:var(--amber)">Only ${product.stockQuantity} left in stock</span>`;
      $('qty-input').max = product.stockQuantity;
    } else {
      stock.innerHTML = '<span class="dot"></span><span class="text-success">In stock</span>';
      $('qty-input').max = product.stockQuantity;
    }

    if (product.isDemoData) $('pdp-demo').classList.remove('hidden');

    renderSpecs();
    renderSeedInfo();
    renderLabelInfo();
    renderBatch();

    // related products
    const relGrid = $('related-grid');
    if (related.length) {
      related.forEach((p) => relGrid.appendChild(relatedCard(p)));
    } else {
      $('related-section').classList.add('hidden');
    }
  }

  function wire() {
    $('qty-minus').addEventListener('click', () => {
      const input = $('qty-input');
      input.value = Math.max(1, (parseInt(input.value, 10) || 1) - 1);
    });
    $('qty-plus').addEventListener('click', () => {
      const input = $('qty-input');
      const max = parseInt(input.max, 10) || 999;
      input.value = Math.min(max, (parseInt(input.value, 10) || 1) + 1);
    });
    $('qty-input').addEventListener('change', currentQty);

    $('add-cart').addEventListener('click', () => {
      if (!product) return;
      const qty = currentQty();
      cart.add(UI.cartLine(product), qty);
      UI.refreshBadges();
      toast(`${qty} × ${product.name} added to cart`);
    });

    $('add-wish').addEventListener('click', async (e) => {
      if (!product) return;
      if (!UI.requireLogin()) return;
      const btn = e.currentTarget;
      const wished = (authStore.user.wishlist || []).includes(product._id);
      try {
        if (wished) {
          await api.del(`/users/wishlist/${product._id}`);
          authStore.user.wishlist = authStore.user.wishlist.filter((id) => id !== product._id);
          btn.innerHTML = '♡ Wishlist';
          toast('Removed from wishlist', 'info');
        } else {
          await api.post(`/users/wishlist/${product._id}`);
          authStore.user.wishlist = [...new Set([...(authStore.user.wishlist || []), product._id])];
          btn.innerHTML = '♥ In Wishlist';
          toast('Added to wishlist');
        }
        localStorage.setItem('agroshield_user', JSON.stringify(authStore.user));
        UI.refreshBadges();
      } catch (err) {
        toast(err.message, 'error');
      }
    });
  }

  document.addEventListener('DOMContentLoaded', async () => {
    UI.mountNav();
    UI.mountFooter();
    wire();

    // reflect initial wishlist state once loaded
    await load();
    if (product && authStore.isLoggedIn) {
      await authStore.refresh();
      if ((authStore.user.wishlist || []).includes(product._id)) {
        $('add-wish').innerHTML = '♥ In Wishlist';
      }
    }
    UI.refreshBadges();
  });
})();
