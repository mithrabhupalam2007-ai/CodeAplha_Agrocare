/**
 * Product details page: image gallery + zoom lightbox, full product data,
 * availability (out-of-stock) states, quantity picker, add to cart,
 * wishlist toggle and the related-products carousel.
 */
(() => {
  let product = null;
  let related = [];
  let galleryImages = [];

  const $ = (id) => document.getElementById(id);
  const isAvailable = () => Boolean(product && product.available !== false);

  function currentQty() {
    const input = $('qty-input');
    const max = isAvailable() ? Math.max(1, product.stockQuantity) : 1;
    let n = parseInt(input.value, 10);
    if (Number.isNaN(n) || n < 1) n = 1;
    if (n > max) n = max;
    input.value = n;
    return n;
  }

  /* ---------------- gallery ---------------- */
  function renderGallery() {
    galleryImages = [product.image, ...(product.images || []).filter(Boolean)].filter(
      (src, i, arr) => arr.indexOf(src) === i
    );
    const main = $('pdp-image');
    main.src = product.image;
    main.alt = product.name;

    const thumbs = $('pdp-thumbs');
    if (galleryImages.length > 1) {
      thumbs.hidden = false;
      thumbs.innerHTML = galleryImages
        .map(
          (src, i) =>
            `<button class="pdp__thumb ${i === 0 ? 'on' : ''}" type="button" data-src="${UI.esc(src)}">
               <img src="${UI.esc(src)}" alt="${UI.esc(product.name)} view ${i + 1}" loading="lazy" />
             </button>`
        )
        .join('');
      thumbs.querySelectorAll('.pdp__thumb').forEach((btn) => {
        btn.addEventListener('click', () => {
          main.src = btn.dataset.src;
          thumbs.querySelectorAll('.pdp__thumb').forEach((b) => b.classList.toggle('on', b === btn));
        });
      });
    } else {
      thumbs.hidden = true;
      thumbs.innerHTML = '';
    }
  }

  function wireLightbox() {
    const box = $('lightbox');
    const img = $('lightbox-img');

    /* Open ONLY on demand — clicking the product image or the zoom button.
       The modal's visibility is the `.open` class (plus the synced `hidden`
       attribute); it is never left open from page load. */
    const open = () => {
      if (!product) return;
      img.src = $('pdp-image').src;
      img.alt = product.name;
      box.hidden = false;
      box.classList.add('open'); // CSS: .lightbox.open { display: flex }
      document.body.style.overflow = 'hidden'; // freeze background scroll
      $('lightbox-close').focus();
    };

    /* Close restores page brightness (backdrop removed), scrolling and
       interaction, and returns focus to the zoom control. */
    const close = () => {
      box.classList.remove('open');
      box.hidden = true;
      document.body.style.overflow = '';
      $('pdp-zoom-btn').focus();
    };

    $('pdp-image').addEventListener('click', open);
    $('pdp-zoom-btn').addEventListener('click', open);
    $('lightbox-close').addEventListener('click', close);
    box.addEventListener('click', (e) => {
      if (e.target === box) close(); // click outside the image -> backdrop
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && box.classList.contains('open')) close();
    });
  }

  /* ---------------- info panels ---------------- */
  function renderSpecs() {
    const mainCat = product.primaryCategory || '';
    const subLabel = TAXONOMY.labelFor(product);
    const rows = [
      ['Brand / manufacturer', product.brand],
      ['Main category', mainCat],
      // Heading/subcategory row — omitted when it would duplicate the main
      // (legacy heading-only records show their heading here).
      ...(subLabel && subLabel !== mainCat ? [['Category', subLabel]] : []),
      ['Pack size', product.packSize],
      ['Price', `${UI.inr(product.price)} per ${product.packSize}`],
      ['Availability', isAvailable() ? `${product.stockQuantity} units available` : 'Currently out of stock'],
      [
        'Release date',
        product.releaseDate ? UI.formatDate(product.releaseDate) : product.createdAt ? UI.formatDate(product.createdAt) : '',
      ],
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
      product.primaryCategory === 'Seeds' &&
      (s.variety || s.cropType || s.germinationPercent || s.sowingInstructions || s.daysToGerminate);
    if (!has) return;
    $('seed-panel').classList.remove('hidden');

    const rows = [];
    if (s.variety) rows.push(['Seed variety', s.variety]);
    if (s.cropType) rows.push(['Crop type', s.cropType]);
    if (s.germinationPercent) rows.push(['Germination', `${s.germinationPercent}% (demo claim, not lab verified)`]);
    if (s.daysToGerminate) rows.push(['Time to germination', s.daysToGerminate]);
    if (s.sowingInstructions) rows.push(['Sowing instructions', s.sowingInstructions]);

    $('seed-body').innerHTML = rows
      .map(([k, v]) => `<tr><td>${UI.esc(k)}</td><td>${UI.esc(v)}</td></tr>`)
      .join('');
  }

  function renderLabelInfo() {
    // Label/registration demo panel belongs to crop-protection listings.
    if (product.primaryCategory !== 'Crop Protection') return;
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

  /* ---------------- availability UI ---------------- */
  function renderAvailability() {
    const available = isAvailable();
    const stock = $('pdp-stock');
    const badge = $('pdp-avail-badge');
    const oos = $('pdp-oos');

    $('qty-input').max = available ? product.stockQuantity : 1;
    $('add-cart').disabled = !available;
    $('buy-now').disabled = !available;
    $('qty-minus').disabled = !available;

    if (!available) {
      const label = product.stockStatus === 'unavailable' ? 'Unavailable' : 'Out of Stock';
      stock.innerHTML = `<span class="dot"></span><span class="text-danger">${label}</span>`;
      badge.textContent = label;
      badge.className = 'pdp__avail-badge pdp__avail-badge--out';
      oos.classList.remove('hidden');
      if (product.stockStatus !== 'unavailable' && !product.manualOutOfStock && product.stockQuantity > 0) {
        // should not happen, but never trust stale data
        oos.querySelector('p').textContent = 'This product is currently unavailable. Please check back later.';
      }
    } else if (product.stockStatus === 'low') {
      stock.innerHTML = `<span class="dot"></span><span style="color:var(--amber)">Low stock — only ${product.stockQuantity} left</span>`;
      badge.textContent = `Low Stock · ${product.stockQuantity}`;
      badge.className = 'pdp__avail-badge pdp__avail-badge--low';
      oos.classList.add('hidden');
    } else {
      stock.innerHTML = '<span class="dot"></span><span class="text-success">In Stock</span>';
      badge.textContent = 'In Stock';
      badge.className = 'pdp__avail-badge pdp__avail-badge--in';
      oos.classList.add('hidden');
    }

    // genuine discount only (backend sets discountPercent when mrp > price)
    if (product.discountPercent > 0) {
      $('pdp-mrp').textContent = UI.inr(product.mrp);
      $('pdp-discount').textContent = `${product.discountPercent}% off`;
      $('pdp-discount').hidden = false;
    } else {
      $('pdp-mrp').textContent = '';
      $('pdp-discount').hidden = true;
    }
  }

  /* ---------------- related carousel ---------------- */
  function relatedCard(p) {
    const d = document.createElement('article');
    d.className = 'p-card carousel__card';
    const available = p.available !== false;
    const stockTxt = !available
      ? p.stockStatus === 'unavailable'
        ? 'Unavailable'
        : 'Out of Stock'
      : p.stockStatus === 'low'
        ? `Low Stock · ${p.stockQuantity}`
        : 'In Stock';
    const stockCls = !available ? 'out' : p.stockStatus === 'low' ? 'low' : 'in';
    const wished = ((authStore.user && authStore.user.wishlist) || []).includes(p._id);

    d.innerHTML = `
      <div class="p-card__media">
        <div class="p-card__flags">
          ${p.discountPercent > 0 ? `<span class="badge badge--red">${p.discountPercent}% off</span>` : ''}
          ${!available ? '<span class="badge badge--red">Out of Stock</span>' : ''}
        </div>
        <button class="p-card__wish ${wished ? 'on' : ''}" type="button" aria-label="Toggle wishlist" data-wish>${I.heart}</button>
        <a href="/pages/product-details.html?id=${p._id}"><img src="${UI.esc(p.image)}" alt="${UI.esc(p.name)}" loading="lazy" /></a>
      </div>
      <div class="p-card__body">
        <span class="p-card__cat">${UI.esc(TAXONOMY.labelFor(p))}</span>
        <h3 class="p-card__name"><a href="/pages/product-details.html?id=${p._id}">${UI.esc(p.name)}</a></h3>
        ${UI.ratingInline(p.rating)}
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
          // assign through the setter — authStore.user is a fresh object per read
          authStore.user = {
            ...authStore.user,
            wishlist: (authStore.user.wishlist || []).filter((id) => id !== p._id),
          };
          toast('Removed from wishlist', 'info');
        } else {
          await api.post(`/users/wishlist/${p._id}`);
          btn.classList.add('on');
          authStore.user = {
            ...authStore.user,
            wishlist: [...new Set([...(authStore.user.wishlist || []), p._id])],
          };
          toast('Added to wishlist');
        }
        UI.refreshBadges();
      } catch (err) {
        toast(err.message, 'error');
      }
    });
    return d;
  }

  function wireCarousel() {
    const track = $('related-grid');
    // The scrollable element is the wrapping .carousel, not the flex track
    // inside it — arrows must scroll the former.
    const scroller = track.closest('.carousel') || track;
    const step = () => Math.max(240, Math.round(scroller.clientWidth * 0.8));
    $('rel-prev').addEventListener('click', () => scroller.scrollBy({ left: -step(), behavior: 'smooth' }));
    $('rel-next').addEventListener('click', () => scroller.scrollBy({ left: step(), behavior: 'smooth' }));
    const sync = () => {
      // Disable the arrows when there is nothing to scroll in that direction.
      $('rel-prev').disabled = scroller.scrollLeft <= 4;
      $('rel-next').disabled = scroller.scrollLeft + scroller.clientWidth >= scroller.scrollWidth - 4;
    };
    scroller.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    requestAnimationFrame(sync);
    setTimeout(sync, 400);
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
      // Fetch a fuller carousel set (dedicated endpoint, never includes self).
      try {
        const rel = await api.get(`/products/${id}/related?limit=8`);
        related = rel.related || [];
      } catch (_) {
        related = data.related || [];
      }
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
    $('head-sub').textContent = `${product.brand} · ${TAXONOMY.labelFor(product)} · ${product.packSize}`;
    // Breadcrumb: Home / Products / main category / subcategory / product
    const crumbMain = product.primaryCategory || '';
    const crumbSub = product.subcategory || '';
    $('crumb').innerHTML =
      `<a href="/pages/home.html">Home</a><span>/</span><a href="/pages/products.html">Products</a>` +
      (crumbMain ? `<span>/</span><a href="${TAXONOMY.categoryUrl(crumbMain)}">${UI.esc(crumbMain)}</a>` : '') +
      (crumbSub ? `<span>/</span><a href="${TAXONOMY.subcategoryUrl(crumbMain, crumbSub)}">${UI.esc(crumbSub)}</a>` : '') +
      `<span>/</span><span class="current">${UI.esc(product.name)}</span>`;

    $('pdp-cat').textContent = TAXONOMY.labelFor(product);
    $('pdp-name').textContent = product.name;
    $('pdp-stars').textContent = UI.stars(product.rating);
    // Stable demo rating (3.5–4.5), explicitly labelled — never presented
    // as verified customer reviews.
    $('pdp-reviews').textContent = `${Number(product.rating || 0).toFixed(1)}/5.0 demo rating`;
    $('pdp-brand').textContent = product.brand;
    $('pdp-desc').textContent = product.description;
    $('pdp-price').textContent = UI.inr(product.price);
    $('pdp-pack').textContent = `per ${product.packSize}`;

    renderGallery();
    renderAvailability();

    if (product.isDemoData) $('pdp-demo').classList.remove('hidden');

    renderSpecs();
    renderSeedInfo();
    renderLabelInfo();
    renderBatch();

    // related products
    const relGrid = $('related-grid');
    relGrid.innerHTML = '';
    const relItems = related.filter((p) => p._id !== product._id);
    if (relItems.length) {
      relItems.forEach((p) => relGrid.appendChild(relatedCard(p)));
      // The carousel arrows are wired at init (grid still empty) — re-sync
      // their enabled/disabled state now that the cards have been laid out.
      window.dispatchEvent(new Event('resize'));
    } else {
      $('related-section').classList.add('hidden');
    }
  }

  function wire() {
    wireLightbox();
    wireCarousel();

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
      if (!product || !isAvailable()) return;
      const qty = currentQty();
      // Merge (never a duplicate line), capped at real stock — `added` is the
      // quantity actually in the cart after the merge.
      const added = cart.add(UI.cartLine(product), qty);
      UI.refreshBadges();
      toast(`Added to cart successfully — ${added} × ${product.name}`);
      // Brief confirmed state on the button (re-clicks still add again).
      const btn = $('add-cart');
      if (!btn.dataset.busy) {
        const label = btn.textContent;
        btn.dataset.busy = '1';
        btn.textContent = '✓ Added to Cart';
        btn.classList.add('is-added');
        setTimeout(() => {
          btn.textContent = label;
          btn.classList.remove('is-added');
          delete btn.dataset.busy;
        }, 1300);
      }
    });

    $('buy-now').addEventListener('click', () => {
      if (!product) return;
      if (!isAvailable()) {
        toast('This product is currently unavailable.', 'error');
        return;
      }
      // Express checkout for just this product and quantity — the cart is
      // never touched. If the visitor is logged out, requireLogin (and the
      // login page) preserve this query string, so they come straight back.
      location.href = `/pages/checkout.html?buy=${product._id}&qty=${currentQty()}`;
    });

    $('add-wish').addEventListener('click', async (e) => {
      if (!product) return;
      if (!UI.requireLogin()) return;
      const btn = e.currentTarget;
      const wished = (authStore.user.wishlist || []).includes(product._id);
      try {
        if (wished) {
          await api.del(`/users/wishlist/${product._id}`);
          // authStore.user is a getter (fresh object each read) — assign the
          // whole object so the setter persists the change to localStorage.
          authStore.user = {
            ...authStore.user,
            wishlist: (authStore.user.wishlist || []).filter((id) => id !== product._id),
          };
          btn.innerHTML = '♡ Wishlist';
          toast('Removed from wishlist', 'info');
        } else {
          await api.post(`/users/wishlist/${product._id}`);
          authStore.user = {
            ...authStore.user,
            wishlist: [...new Set([...(authStore.user.wishlist || []), product._id])],
          };
          btn.innerHTML = '♥ In Wishlist';
          toast('Added to wishlist');
        }
        UI.refreshBadges();
      } catch (err) {
        toast(err.message, 'error');
      }
    });
  }

  document.addEventListener('DOMContentLoaded', async () => {
    UI.mountNav();
    UI.mountFooter();
    if (!UI.requireLogin()) return; // shop is only reachable after login
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
