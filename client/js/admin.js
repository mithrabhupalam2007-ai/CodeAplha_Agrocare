/**
 * Admin dashboard: stats, product CRUD, order status management,
 * customer list and category management. Every call goes through
 * /api/admin/* which enforces the admin role server-side too.
 */
(() => {
  const $ = (id) => document.getElementById(id);
  const STATUSES = ['Placed', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

  /* ================= tabs ================= */
  function switchTab(name) {
    if (name === 'logout') {
      authStore.logout().then(() => {
        toast('Logged out.', 'info');
        setTimeout(() => (location.href = '/'), 400);
      });
      return;
    }

    // "Add New Product" is a shortcut: it shows the product list in the
    // background and opens the add-product form on top of it.
    if (name === 'add-product') {
      document.querySelectorAll('.side-nav button').forEach((b) =>
        b.classList.toggle('active', b.dataset.tab === 'add-product')
      );
      document.querySelectorAll('.tab-panel').forEach((p) =>
        p.classList.toggle('hidden', p.dataset.panel !== 'products')
      );
      loadProducts();
      openProductModal();
      return;
    }

    document.querySelectorAll('.side-nav button').forEach((b) =>
      b.classList.toggle('active', b.dataset.tab === name)
    );
    document.querySelectorAll('.tab-panel').forEach((p) =>
      p.classList.toggle('hidden', p.dataset.panel !== name)
    );

    if (name === 'dashboard') loadDashboard();
    if (name === 'products') loadProducts();
    if (name === 'editprices') loadPriceList();
    if (name === 'newreleases') loadNewReleases();
    if (name === 'inventory') loadInventory('inventory');
    if (name === 'outofstock') loadInventory('outofstock');
    if (name === 'orders') loadOrders();
    if (name === 'customers') loadCustomers();
    if (name === 'categories') loadCategories();
  }

  /* ================= dashboard ================= */
  async function loadDashboard() {
    try {
      const data = await api.get('/admin/dashboard');
      const s = data.stats;

      $('s-revenue').textContent = UI.inr(s.revenue);
      $('s-rev-sub').textContent = `avg order ${UI.inr(s.averageOrderValue)}`;
      $('s-orders').textContent = s.totalOrders.toLocaleString('en-IN');
      $('s-orders-sub').textContent = `${s.paidOrders} fulfilled / in progress`;
      $('s-active').textContent = (s.activeProducts ?? 0).toLocaleString('en-IN');
      $('s-newreleases').textContent = (s.newReleases ?? 0).toLocaleString('en-IN');
      $('s-products').textContent = s.totalProducts.toLocaleString('en-IN');
      $('s-products-sub').textContent = `${s.activeProducts} active · ${s.inactiveProducts} inactive`;
      $('s-instock').textContent = (s.inStockProducts ?? 0).toLocaleString('en-IN');
      $('s-oos').textContent = (s.outOfStockProducts ?? 0).toLocaleString('en-IN');
      $('oos-card').classList.toggle('alerted', (s.outOfStockProducts || 0) > 0);
      $('s-users').textContent = (s.totalCustomers ?? 0).toLocaleString('en-IN');
      $('s-users-sub').textContent = `${s.totalUsers ?? 0} account(s) incl. admin`;
      $('s-lowstock').textContent = s.lowStockCount;
      $('s-lowstock-sub').textContent = `threshold: ≤ ${s.lowStockThreshold} units`;
      $('lowstock-card').classList.toggle('alerted', s.lowStockCount > 0);

      // monthly chart (last 6 buckets returned by the API)
      const months = data.monthlySales.slice(-6);
      const max = Math.max(1, ...months.map((m) => m.revenue));
      $('sales-chart').innerHTML = months.length
        ? months
            .map(
              (m) => `
          <div class="bar" title="${m._id}: ${UI.inr(m.revenue)} from ${m.orders} orders">
            <i style="height:${Math.round((m.revenue / max) * 100)}%"></i>
            <span>${m._id}</span>
          </div>`
            )
            .join('')
        : '<p class="text-muted">No sales data yet.</p>';

      $('status-table').innerHTML = Object.entries(s.statusCounts)
        .map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`)
        .join('');

      $('top-products').innerHTML = data.topProducts.length
        ? data.topProducts
            .map((t) => `<tr><td>${UI.esc(t._id)}</td><td>${t.units} units</td><td>${UI.inr(t.revenue)}</td></tr>`)
            .join('')
        : '<tr><td colspan="3" class="text-muted">No sales yet.</td></tr>';

      $('lowstock-table').innerHTML = data.lowStock.length
        ? data.lowStock
            .map(
              (p) =>
                `<tr><td>${UI.esc(p.name)}</td><td><span class="badge ${p.stockQuantity === 0 ? 'badge--red' : 'badge--amber'}">${p.stockQuantity}</span></td></tr>`
            )
            .join('')
        : '<tr><td colspan="2" class="text-success">All products sufficiently stocked ✓</td></tr>';

      $('recent-orders').innerHTML = data.recentOrders.length
        ? data.recentOrders
            .map(
              (o) => `
          <tr>
            <td><b>#${UI.esc(o.orderId)}</b></td>
            <td>${UI.esc((o.user && o.user.name) || '—')}<br/><span class="text-muted" style="font-size:.78rem;">${UI.esc((o.user && o.user.email) || '')}</span></td>
            <td>${UI.inr(o.total)}</td>
            <td><span class="status-pill status-${o.orderStatus.toLowerCase()}">${o.orderStatus}</span></td>
            <td>${UI.formatDate(o.createdAt)}</td>
          </tr>`
            )
            .join('')
        : '<tr><td colspan="5" class="text-muted">No orders yet.</td></tr>';
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  /* ================= products ================= */
  const prodState = { page: 1, search: '', type: '', category: '' };

  /**
   * Subcategory filter options: the subs of the chosen main category, or
   * every sub across all seven mains (deduplicated) when none is picked.
   */
  function fillSubFilter() {
    const sel = $('prod-cat');
    const current = prodState.category;
    sel.innerHTML = '';
    sel.add(new Option('All subcategories', ''));
    const subs = prodState.type
      ? TAXONOMY.subcategoriesOf(prodState.type)
      : [...new Set(TAXONOMY.MAIN.flatMap((m) => TAXONOMY.subcategoriesOf(m)))];
    subs.forEach((s) => sel.add(new Option(s, s)));
    if (current && subs.includes(current)) sel.value = current;
  }

  async function loadProducts() {
    const tbody = $('prod-table');
    tbody.innerHTML = '<tr><td colspan="7"><div class="spinner"></div></td></tr>';
    try {
      // /admin/products also returns inactive items, so admins can manage
      // everything. `type` filters the main category, `category` the
      // subcategory (historic API alias).
      const data = await api.get(
        '/admin/products' +
          api.qs({
            search: prodState.search,
            type: prodState.type,
            category: prodState.category,
            page: prodState.page,
            limit: 10,
          })
      );

      tbody.innerHTML = data.products.length
        ? data.products
            .map(
              (p) => `
        <tr>
          <td><img src="${UI.esc(p.image)}" alt="" /></td>
          <td><b>${UI.esc(p.name)}</b><br/><span class="text-muted" style="font-size:.78rem;">${UI.esc(p.brand)} · ${UI.esc(p.packSize)}</span>${p.isDemoData ? ' <span class="badge badge--amber">demo</span>' : ''}${p.isNewRelease ? ' <span class="badge badge--green">new</span>' : ''}${p.manualOutOfStock ? ' <span class="badge badge--red">blocked</span>' : ''}<br/>${UI.ratingInline(p.rating)}</td>
          <td>${UI.esc(TAXONOMY.labelFor(p))}</td>
          <td><b>${UI.inr(p.price)}</b>${p.discountPercent > 0 ? `<br/><span class="text-muted" style="font-size:.75rem;">MRP ${UI.inr(p.mrp)}</span>` : ''}${p.priceExempt ? '<br/><span class="badge badge--red" title="Outside the category price band — owner-approved exception">price exempt</span>' : ''}</td>
          <td><span class="badge ${p.stockQuantity === 0 ? 'badge--red' : p.stockQuantity <= 5 ? 'badge--amber' : 'badge--green'}">${p.stockQuantity}</span></td>
          <td><span class="badge ${p.active ? 'badge--green' : 'badge--grey'}">${p.active ? 'Active' : 'Inactive'}</span></td>
          <td>
            <div class="cell-actions">
              <button class="btn btn--ghost btn--sm" data-edit="${p._id}">Edit</button>
              <button class="btn btn--${p.active ? 'danger' : 'accent'} btn--sm" data-toggle="${p._id}" data-active="${p.active}" data-name="${UI.esc(p.name)}">${p.active ? 'Deactivate' : 'Activate'}</button>
              <button class="btn btn--danger btn--sm" data-del="${p._id}" data-name="${UI.esc(p.name)}">Delete</button>
            </div>
          </td>
        </tr>`
            )
            .join('')
        : '<tr><td colspan="7" class="text-center text-muted" style="padding:30px;">No products match your search.</td></tr>';

      // A broken image path (file deleted or never imported) is flagged in
      // place so admins can spot and repair it.
      tbody.querySelectorAll('img').forEach((img) =>
        img.addEventListener(
          'error',
          () => {
            const td = img.closest('td');
            if (td) td.innerHTML = '<span class="badge badge--red">missing image</span>';
          },
          { once: true }
        )
      );

      renderPager($('prod-pager'), data.pagination, (p) => {
        prodState.page = p;
        loadProducts();
      });

      tbody.querySelectorAll('[data-edit]').forEach((b) =>
        b.addEventListener('click', () => openProductModal(b.dataset.edit))
      );
      tbody.querySelectorAll('[data-toggle]').forEach((b) =>
        b.addEventListener('click', () => toggleProduct(b.dataset.toggle, b.dataset.active === 'true', b.dataset.name))
      );
      tbody.querySelectorAll('[data-del]').forEach((b) =>
        b.addEventListener('click', () => deleteProduct(b.dataset.del, b.dataset.name))
      );
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="7"><div class="alert show alert--error">${UI.esc(err.message)}</div></td></tr>`;
    }
  }

  async function toggleProduct(id, isActive, name) {
    try {
      const data = await api.patch(`/products/${id}`, { active: !isActive });
      toast(data.message);
      loadProducts();
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  async function deleteProduct(id, name) {
    if (!confirm(`Permanently delete "${name}"? This cannot be undone.\n\nTip: use Deactivate to hide a product while keeping history.`))
      return;
    try {
      const data = await api.del(`/products/${id}?permanent=true`);
      toast(data.message);
      loadProducts();
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  /**
   * Populate every main-category <select> (product form + category form)
   * from the store taxonomy, keeping the current value when still valid.
   */
  function fillMainOptions() {
    document.querySelectorAll('.js-main-select').forEach((sel) => {
      const current = sel.value;
      sel.innerHTML = '';
      TAXONOMY.MAIN.forEach((m) => sel.add(new Option(m, m)));
      if (current && TAXONOMY.isMain(current)) sel.value = current;
    });
  }

  /**
   * Heading-section select for a main category (first cascade level).
   * Tapas has no heading sections — the select is disabled with an empty
   * value and its seven subcategories are offered directly.
   */
  function fillHeadings(type, selected) {
    const sel = $('pm-heading');
    sel.innerHTML = '';
    // Live price-band hint for the chosen main category (client mirror of
    // server/utils/pricing.js — the backend stays the source of truth).
    if ($('pm-price-hint')) $('pm-price-hint').textContent = PRICING.rangeLabel(type);
    const headings = TAXONOMY.headingsOf(type).filter(Boolean);
    if (!headings.length) {
      sel.add(new Option('— no heading sections —', ''));
      sel.disabled = true;
      $('pm-heading-hint').textContent = '(Tapas lists its subcategories directly)';
      return;
    }
    sel.disabled = false;
    $('pm-heading-hint').textContent = `(${headings.length} sections)`;
    sel.add(new Option('All heading sections', ''));
    headings.forEach((h) => sel.add(new Option(h, h)));
    if (selected && headings.includes(selected)) sel.value = selected;
  }

  /**
   * Subcategory select (second cascade level): the subs of the chosen
   * heading, or every sub of the main category when no heading is picked.
   * Every one of the seven main categories has subcategories.
   */
  function fillSubcategories(type, heading, selected) {
    const sel = $('pm-category');
    sel.innerHTML = '';
    const subs = heading
      ? TAXONOMY.subcategoriesUnder(type, heading)
      : TAXONOMY.subcategoriesOf(type);
    $('pm-sub-hint').textContent = `(${subs.length} options)`;
    sel.add(new Option('Choose a subcategory…', ''));
    subs.forEach((s) => sel.add(new Option(s, s)));
    if (selected && subs.includes(selected)) sel.value = selected;
  }

  function openProductModal(id) {
    const form = $('product-form');
    form.reset();
    form.id.value = '';
    $('pm-title').textContent = 'Add product';
    form.active.checked = true;
    fillMainOptions();
    // After form.reset() the main select is back on its first option —
    // rebuild the rest of the cascade to match it.
    fillHeadings(form.type.value);
    fillSubcategories(form.type.value, form.heading.value);
    form.isSeasonal.checked = false;
    form.seasonalNote.value = '';

    if (id) {
      $('pm-title').textContent = 'Edit product';
      api
        // admin endpoint — also works for inactive products
        .get(`/admin/products/${id}`)
        .then(({ product }) => {
          form.id.value = product._id;
          form.name.value = product.name;
          form.description.value = product.description;
          form.type.value = product.primaryCategory || TAXONOMY.MAIN[0];
          // Repopulate the cascade for this main category, then select the
          // record's heading (if any) and subcategory.
          fillHeadings(product.primaryCategory, product.heading);
          fillSubcategories(product.primaryCategory, product.heading, product.subcategory);
          form.brand.value = product.brand;
          form.packSize.value = product.packSize;
          form.price.value = product.price;
          form.mrp.value = product.mrp ?? '';
          form.stockQuantity.value = product.stockQuantity;
          form.image.value = product.image;
          form.images.value = (product.images || []).join('\n');
          form.crops.value = (product.crops || []).join(', ');
          form.specifications.value = (product.specifications || [])
            .map((s) => `${s.label}: ${s.value}`)
            .join('\n');
          const l = product.labelInfo || {};
          form.labelInfo.value = Object.entries({
            Composition: l.composition,
            'Registration details': l.registrationNo,
            'Label instructions': l.labelInstructions,
            'Safety precautions': l.safetyPrecautions,
            Storage: l.storage,
            'Disposal guidance': l.disposal,
          })
            .filter(([, v]) => v)
            .map(([k, v]) => `${k}: ${v}`)
            .join('\n');
          form.batchNumber.value = (product.batch && product.batch.batchNumber) || '';
          form.expiryDate.value =
            product.batch && product.batch.expiryDate ? String(product.batch.expiryDate).slice(0, 10) : '';
          form.releaseDate.value = product.releaseDate ? String(product.releaseDate).slice(0, 10) : '';
          form.featured.checked = !!product.featured;
          form.bestseller.checked = !!product.bestseller;
          form.isSeasonal.checked = !!product.isSeasonal;
          form.seasonalNote.value = product.seasonalNote || '';
          form.active.checked = !!product.active;
          form.isNewRelease.checked = !!product.isNewRelease;
          form.manualOutOfStock.checked = !!product.manualOutOfStock;
        })
        .catch((err) => toast(err.message, 'error'));
    }
    $('product-modal').classList.add('open');
  }

  /** Parse "Label: Value" lines into [{label, value}]. */
  function parseKeyValues(text) {
    return String(text || '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const i = line.indexOf(':');
        if (i === -1) return { label: line, value: '' };
        return { label: line.slice(0, i).trim(), value: line.slice(i + 1).trim() };
      })
      .filter((kv) => kv.label);
  }

  /** Known label-info keys (display name -> schema key). */
  const LABEL_KEYS = {
    composition: 'composition',
    'registration details': 'registrationNo',
    'label instructions': 'labelInstructions',
    'safety precautions': 'safetyPrecautions',
    storage: 'storage',
    'disposal guidance': 'disposal',
  };

  async function saveProduct(e) {
    e.preventDefault();
    const f = e.target;

    // Split the combined "label & safety" textarea into the schema's
    // labelInfo object; anything unrecognised becomes a specification entry.
    const labelInfo = {};
    const extraSpecs = [];
    parseKeyValues(f.labelInfo.value).forEach((kv) => {
      const key = LABEL_KEYS[kv.label.toLowerCase()];
      if (key && kv.value) labelInfo[key] = kv.value;
      else if (kv.value) extraSpecs.push(kv);
    });

    const batch = {};
    if (f.batchNumber.value.trim()) batch.batchNumber = f.batchNumber.value.trim();
    if (f.expiryDate.value) batch.expiryDate = f.expiryDate.value;

    const payload = {
      name: f.name.value.trim(),
      description: f.description.value.trim(),
      primaryCategory: f.type.value,
      heading: f.heading.value,
      subcategory: f.category.value,
      brand: f.brand.value.trim(),
      packSize: f.packSize.value.trim(),
      price: Number(f.price.value),
      // Explicit, audited escape hatch for prices outside the category band.
      allowOutOfRangePrice: f.allow_out_of_range.checked,
      mrp: f.mrp.value === '' ? null : Number(f.mrp.value),
      stockQuantity: Number(f.stockQuantity.value),
      image: f.image.value.trim(),
      images: f.images.value.split('\n').map((s) => s.trim()).filter(Boolean),
      crops: f.crops.value.split(',').map((c) => c.trim()).filter(Boolean),
      specifications: [...parseKeyValues(f.specifications.value), ...extraSpecs],
      labelInfo,
      batch,
      isNewRelease: f.isNewRelease.checked,
      releaseDate: f.releaseDate.value || null,
      manualOutOfStock: f.manualOutOfStock.checked,
      featured: f.featured.checked,
      bestseller: f.bestseller.checked,
      isSeasonal: f.isSeasonal.checked,
      seasonalNote: f.seasonalNote.value.trim(),
      active: f.active.checked,
    };

    // Friendly pre-flight: every one of the seven main categories has
    // subcategories and a product must belong to one (the server enforces
    // this too; the heading is derived from the taxonomy).
    if (!payload.subcategory) {
      toast(`Please choose a subcategory for ${payload.primaryCategory}.`, 'error');
      $('pm-category').focus();
      return;
    }

    try {
      const data = f.id.value
        ? await api.patch(`/products/${f.id.value}`, payload)
        : await api.post('/products', payload);
      toast(data.message);
      $('product-modal').classList.remove('open');
      const activeTab = document.querySelector('.side-nav button.active');
      const tab = activeTab ? activeTab.dataset.tab : 'products';
      switchTab(tab === 'add-product' ? 'products' : tab);
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  /* ================= inventory / out-of-stock ================= */
  const listState = {
    inventory: { page: 1, search: '' },
    outofstock: { page: 1, search: '' },
  };

  function stockBadge(p) {
    if (!p) return '';
    if (!p.available) {
      return p.stockStatus === 'unavailable'
        ? '<span class="badge badge--grey">Unavailable</span>'
        : '<span class="badge badge--red">Out of stock</span>';
    }
    if (p.stockStatus === 'low') return `<span class="badge badge--amber">${p.stockQuantity} left</span>`;
    return `<span class="badge badge--green">${p.stockQuantity} in stock</span>`;
  }

  const reasonCell = (p) =>
    p.manualOutOfStock
      ? '<span class="badge badge--red">Manual block</span>'
      : '<span class="badge badge--amber">Quantity 0</span>';

  /** Toggle the manual out-of-stock override (availability endpoint). */
  async function toggleManualBlock(id, name, value, view) {
    try {
      const data = await api.patch(`/admin/products/${id}/availability`, { manualOutOfStock: value });
      toast(data.message);
      loadInventory(view);
      if (view === 'outofstock') loadDashboardIfVisible();
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  function loadDashboardIfVisible() {
    const panel = document.querySelector('[data-panel="dashboard"]');
    if (panel && !panel.classList.contains('hidden')) loadDashboard();
  }

  async function loadInventory(view) {
    const isOOS = view === 'outofstock';
    const st = listState[view];
    const tbody = $(isOOS ? 'oos-table' : 'inv-table');
    tbody.innerHTML = `<tr><td colspan="${isOOS ? 7 : 7}"><div class="spinner"></div></td></tr>`;

    try {
      const data = await api.get(
        isOOS
          ? '/admin/products/out-of-stock' +
              api.qs({ search: st.search, reason: st.reason || '', page: st.page, limit: 12 })
          : '/admin/products' +
              api.qs({ search: st.search, page: st.page, limit: 12, status: '' })
      );

      tbody.innerHTML = data.products.length
        ? data.products
            .map((p) => {
              const img = `<td><img src="${UI.esc(p.image)}" alt="" /></td>`;
              const name = `<td><b>${UI.esc(p.name)}</b><br/><span class="text-muted" style="font-size:.78rem;">${UI.esc(p.brand)} · ${UI.esc(p.packSize)}</span></td>`;
              const price = `<td>${UI.inr(p.price)}</td>`;
              const stockInput = `
                <td>
                  <div class="cell-actions">
                    <input type="number" min="0" step="1" value="${p.stockQuantity}" data-stock-input="${p._id}" style="width:84px;padding:6px 8px;border:1.5px solid var(--line-strong);border-radius:6px;font-size:.85rem;" aria-label="Stock quantity for ${UI.esc(p.name)}" />
                    <button class="btn btn--primary btn--sm" data-stock-save="${p._id}" data-name="${UI.esc(p.name)}" data-manual="${p.manualOutOfStock ? '1' : ''}">Update</button>
                  </div>
                </td>`;
              const editBtn = `<button class="btn btn--ghost btn--sm" data-edit="${p._id}">Edit</button>`;

              if (isOOS) {
                const clearBtn = p.manualOutOfStock
                  ? `<button class="btn btn--accent btn--sm" data-manual-toggle="${p._id}" data-value="false" data-name="${UI.esc(p.name)}">Clear block</button>`
                  : '';
                return `<tr>
                  ${img}${name}<td>${UI.esc(TAXONOMY.labelFor(p))}</td>${price}
                  <td>${reasonCell(p)}</td>
                  ${stockInput}
                  <td><div class="cell-actions">${editBtn}${clearBtn}</div></td>
                </tr>`;
              }

              // inventory view: manual-block toggle + visibility
              const manualCell = p.manualOutOfStock
                ? `<span class="badge badge--red">Blocked</span> <button class="btn btn--ghost btn--sm" data-manual-toggle="${p._id}" data-value="false" data-name="${UI.esc(p.name)}">Clear block</button>`
                : `<span class="badge badge--green">Selling</span> <button class="btn btn--ghost btn--sm" data-manual-toggle="${p._id}" data-value="true" data-name="${UI.esc(p.name)}">Mark out of stock</button>`;
              return `<tr>
                ${img}${name}${price}${stockInput}
                <td>${stockBadge(p)}</td>
                <td>
                  <span class="badge ${p.active ? 'badge--green' : 'badge--grey'}">${p.active ? 'Active' : 'Inactive'}</span>
                  <div style="margin-top:6px;">${manualCell}</div>
                </td>
                <td><div class="cell-actions">${editBtn}</div></td>
              </tr>`;
            })
            .join('')
        : `<tr><td colspan="${isOOS ? 7 : 7}" class="text-center text-muted" style="padding:30px;">${
            isOOS ? 'Nice — no products are out of stock right now.' : 'No products match your search.'
          }</td></tr>`;

      renderPager($(isOOS ? 'oos-pager' : 'inv-pager'), data.pagination, (p) => {
        st.page = p;
        loadInventory(view);
      });

      tbody.querySelectorAll('[data-stock-save]').forEach((b) =>
        b.addEventListener('click', () => updateStock(b.dataset.stockSave, b.dataset.name, view, b.dataset.manual === '1'))
      );
      tbody.querySelectorAll('[data-manual-toggle]').forEach((b) =>
        b.addEventListener('click', () =>
          toggleManualBlock(b.dataset.manualToggle, b.dataset.name, b.dataset.value === 'true', view)
        )
      );
      tbody.querySelectorAll('[data-edit]').forEach((b) =>
        b.addEventListener('click', () => openProductModal(b.dataset.edit))
      );
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="${isOOS ? 7 : 7}"><div class="alert show alert--error">${UI.esc(err.message)}</div></td></tr>`;
    }
  }

  async function updateStock(id, name, view, wasManual) {
    const input = document.querySelector(`[data-stock-input="${id}"]`);
    const qty = Number(input ? input.value : NaN);
    if (!Number.isInteger(qty) || qty < 0) {
      toast('Stock must be a whole number of 0 or more.', 'error');
      return;
    }
    try {
      // Restocking also clears a manual block so availability is restored
      // as soon as the product is active and quantity > 0.
      const data = await api.patch(`/admin/products/${id}/stock`, {
        stockQuantity: qty,
        clearManualOutOfStock: qty > 0 && wasManual,
      });
      toast(data.message);
      if (wasManual && qty > 0) toast(`${name} restocked and its manual block was cleared ✓`);
      loadInventory(view);
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  /* ================= edit prices & new releases ================= */
  const priceState = { page: 1, search: '' };
  const newState = { page: 1, search: '', filter: '' };

  async function loadPriceList() {
    const tbody = $('price-table');
    tbody.innerHTML = '<tr><td colspan="8"><div class="spinner"></div></td></tr>';
    try {
      const data = await api.get(
        '/admin/products' + api.qs({ search: priceState.search, page: priceState.page, limit: 12 })
      );

      tbody.innerHTML = data.products.length
        ? data.products
            .map((p) => {
              const disc =
                p.discountPercent > 0 ? `<span class="badge badge--red">${p.discountPercent}% off</span>` : '—';
              return `
        <tr>
          <td><img src="${UI.esc(p.image)}" alt="" /></td>
          <td><b>${UI.esc(p.name)}</b><br/><span class="text-muted" style="font-size:.78rem;">${UI.esc(p.brand)}</span></td>
          <td>${UI.esc(TAXONOMY.labelFor(p))}</td>
          <td>${p.mrp ? UI.inr(p.mrp) : '<span class="text-muted">—</span>'}</td>
          <td><b>${UI.inr(p.price)}</b></td>
          <td>${disc}</td>
          <td>
            <div class="cell-actions">
              <input type="number" min="0" step="0.01" value="${p.price}" data-price-input="${p._id}" style="width:92px;padding:6px 8px;border:1.5px solid var(--line-strong);border-radius:6px;font-size:.85rem;" aria-label="New price for ${UI.esc(p.name)}" />
              <button class="btn btn--primary btn--sm" data-price-save="${p._id}" data-name="${UI.esc(p.name)}">Update</button>
            </div>
          </td>
          <td><button class="btn btn--ghost btn--sm" data-edit="${p._id}">Full edit</button></td>
        </tr>`;
            })
            .join('')
        : '<tr><td colspan="8" class="text-center text-muted" style="padding:30px;">No products match your search.</td></tr>';

      renderPager($('price-pager'), data.pagination, (p) => {
        priceState.page = p;
        loadPriceList();
      });

      tbody.querySelectorAll('[data-price-save]').forEach((b) =>
        b.addEventListener('click', () => updatePrice(b.dataset.priceSave, b.dataset.name))
      );
      tbody.querySelectorAll('[data-edit]').forEach((b) =>
        b.addEventListener('click', () => openProductModal(b.dataset.edit))
      );
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="8"><div class="alert show alert--error">${UI.esc(err.message)}</div></td></tr>`;
    }
  }

  async function updatePrice(id, name) {
    const input = document.querySelector(`[data-price-input="${id}"]`);
    const price = Number(input ? input.value : NaN);
    if (Number.isNaN(price) || price < 0) {
      toast('Enter a valid non-negative price.', 'error');
      return;
    }
    try {
      const data = await api.patch(`/admin/products/${id}/price`, { price });
      toast(data.message);
      loadPriceList();
    } catch (err) {
      // Out-of-band prices are rejected by the backend unless the admin
      // explicitly authorizes the override (recorded as priceExempt).
      if (
        String(err.message).includes('outside the allowed range') &&
        confirm(`${err.message}\n\nApply an authorized out-of-range override? The record will be flagged as a price exception.`)
      ) {
        try {
          const data = await api.patch(`/admin/products/${id}/price`, { price, allowOutOfRangePrice: true });
          toast(data.message);
          loadPriceList();
          return;
        } catch (e2) {
          toast(e2.message, 'error');
          return;
        }
      }
      toast(err.message, 'error');
    }
  }

  async function loadNewReleases() {
    const tbody = $('new-table');
    tbody.innerHTML = '<tr><td colspan="6"><div class="spinner"></div></td></tr>';
    try {
      const data = await api.get(
        '/admin/products' +
          api.qs({
            search: newState.search,
            status: newState.filter === 'newrelease' ? 'newrelease' : '',
            page: newState.page,
            limit: 12,
          })
      );

      tbody.innerHTML = data.products.length
        ? data.products
            .map((p) => `
        <tr>
          <td><img src="${UI.esc(p.image)}" alt="" /></td>
          <td><b>${UI.esc(p.name)}</b><br/><span class="text-muted" style="font-size:.78rem;">${UI.esc(p.brand)} · ${UI.inr(p.price)}</span></td>
          <td>${UI.esc(TAXONOMY.labelFor(p))}</td>
          <td>${p.releaseDate ? UI.formatDate(p.releaseDate) : '<span class="text-muted">—</span>'}</td>
          <td><span class="badge ${p.isNewRelease ? 'badge--green' : 'badge--grey'}">${p.isNewRelease ? 'New release' : 'Not flagged'}</span></td>
          <td>
            <div class="cell-actions">
              <button class="btn btn--${p.isNewRelease ? 'danger' : 'accent'} btn--sm" data-new-toggle="${p._id}" data-value="${!p.isNewRelease}" data-name="${UI.esc(p.name)}">
                ${p.isNewRelease ? 'Remove from New Releases' : 'Mark as New Release'}
              </button>
              <button class="btn btn--ghost btn--sm" data-edit="${p._id}">Edit date</button>
            </div>
          </td>
        </tr>`)
            .join('')
        : '<tr><td colspan="6" class="text-center text-muted" style="padding:30px;">No products match your search.</td></tr>';

      renderPager($('new-pager'), data.pagination, (p) => {
        newState.page = p;
        loadNewReleases();
      });

      tbody.querySelectorAll('[data-new-toggle]').forEach((b) =>
        b.addEventListener('click', () =>
          toggleNewRelease(b.dataset.newToggle, b.dataset.name, b.dataset.value === 'true')
        )
      );
      tbody.querySelectorAll('[data-edit]').forEach((b) =>
        b.addEventListener('click', () => openProductModal(b.dataset.edit))
      );
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="6"><div class="alert show alert--error">${UI.esc(err.message)}</div></td></tr>`;
    }
  }

  async function toggleNewRelease(id, name, value) {
    try {
      const data = await api.patch(`/admin/products/${id}/availability`, { isNewRelease: value });
      toast(data.message);
      loadNewReleases();
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  /* ================= orders ================= */
  const ordState = { page: 1, search: '', status: '' };

  async function loadOrders() {
    const tbody = $('ord-table');
    tbody.innerHTML = '<tr><td colspan="8"><div class="spinner"></div></td></tr>';
    try {
      const data = await api.get(
        '/admin/orders' + api.qs({ search: ordState.search, status: ordState.status, page: ordState.page, limit: 10 })
      );

      tbody.innerHTML = data.orders.length
        ? data.orders
            .map((o) => {
              const itemCount = o.items.reduce((n, i) => n + i.quantity, 0);
              return `
        <tr>
          <td><b>#${UI.esc(o.orderId)}</b><br/><span class="text-muted" style="font-size:.78rem;">${UI.formatDate(o.createdAt)}</span></td>
          <td>${UI.esc((o.user && o.user.name) || o.shippingAddress.fullName)}<br/><span class="text-muted" style="font-size:.78rem;">${UI.esc(o.shippingAddress.phone)}</span></td>
          <td>${o.items.length} product(s), ${itemCount} unit(s)</td>
          <td><b>${UI.inr(o.total)}</b></td>
          <td>${o.paymentMethod === 'cod' ? 'COD' : 'Demo'}<br/><span class="text-muted" style="font-size:.78rem;">${o.paymentStatus}</span></td>
          <td><span class="status-pill status-${o.orderStatus.toLowerCase()}">${o.orderStatus}</span></td>
          <td>${UI.formatDate(o.createdAt)}</td>
          <td>
            <select data-status="${o._id}" aria-label="Update status" style="padding:6px 9px;border:1.5px solid var(--line-strong);border-radius:6px;font-size:.85rem;">
              ${STATUSES.map((s) => `<option ${s === o.orderStatus ? 'selected' : ''}>${s}</option>`).join('')}
            </select>
          </td>
        </tr>`;
            })
            .join('')
        : '<tr><td colspan="8" class="text-center text-muted" style="padding:30px;">No orders match your filters.</td></tr>';

      renderPager($('ord-pager'), data.pagination, (p) => {
        ordState.page = p;
        loadOrders();
      });

      tbody.querySelectorAll('[data-status]').forEach((sel) =>
        sel.addEventListener('change', async () => {
          const id = sel.dataset.status;
          const newStatus = sel.value;
          if (!confirm(`Change order status to "${newStatus}"?`)) {
            loadOrders();
            return;
          }
          try {
            const data2 = await api.patch(`/admin/orders/${id}`, { orderStatus: newStatus });
            toast(data2.message);
            loadOrders();
          } catch (err) {
            toast(err.message, 'error');
            loadOrders();
          }
        })
      );
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="8"><div class="alert show alert--error">${UI.esc(err.message)}</div></td></tr>`;
    }
  }

  /* ================= customers ================= */
  const custState = { page: 1 };

  async function loadCustomers() {
    const tbody = $('cust-table');
    tbody.innerHTML = '<tr><td colspan="7"><div class="spinner"></div></td></tr>';
    try {
      const data = await api.get('/admin/customers' + api.qs({ page: custState.page, limit: 12 }));
      tbody.innerHTML = data.customers.length
        ? data.customers
            .map(
              (c) => `
        <tr>
          <td><b>${UI.esc(c.name)}</b></td>
          <td>${UI.esc(c.email)}</td>
          <td>${UI.esc(c.phone)}</td>
          <td>${UI.esc((c.address && c.address.city) || '—')}</td>
          <td>${c.orders}</td>
          <td>${UI.inr(c.totalSpent)}</td>
          <td>${UI.formatDate(c.createdAt)}</td>
        </tr>`
            )
            .join('')
        : '<tr><td colspan="7" class="text-muted" style="padding:30px;">No customers registered yet.</td></tr>';
      renderPager($('cust-pager'), data.pagination, (p) => {
        custState.page = p;
        loadCustomers();
      });
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="7"><div class="alert show alert--error">${UI.esc(err.message)}</div></td></tr>`;
    }
  }

  /* ================= categories ================= */
  async function loadCategories() {
    const tbody = $('cat-table');
    tbody.innerHTML = '<tr><td colspan="5"><div class="spinner"></div></td></tr>';
    try {
      const data = await api.get('/admin/categories');
      tbody.innerHTML = data.categories
        .map(
          (c) => `
      <tr>
        <td><b>${UI.esc(c.name)}</b></td>
        <td><span class="badge badge--green">${UI.esc(c.type)}</span></td>
        <td>${UI.esc(c.description || '—')}</td>
        <td><span class="badge ${c.active ? 'badge--green' : 'badge--grey'}">${c.active ? 'Active' : 'Hidden'}</span></td>
        <td>
          <div class="cell-actions">
            <button class="btn btn--ghost btn--sm" data-edit-cat="${c._id}" data-json='${UI.esc(JSON.stringify(c))}'>Edit</button>
            <button class="btn btn--danger btn--sm" data-del-cat="${c._id}" data-name="${UI.esc(c.name)}">Delete</button>
          </div>
        </td>
      </tr>`
        )
        .join('');

      tbody.querySelectorAll('[data-edit-cat]').forEach((b) =>
        b.addEventListener('click', () => openCategoryModal(JSON.parse(b.dataset.json)))
      );
      tbody.querySelectorAll('[data-del-cat]').forEach((b) =>
        b.addEventListener('click', async () => {
          if (!confirm(`Delete category "${b.dataset.name}"?`)) return;
          try {
            const d = await api.del(`/admin/categories/${b.dataset.delCat}`);
            toast(d.message);
            loadCategories();
          } catch (err) {
            toast(err.message, 'error');
          }
        })
      );
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="5"><div class="alert show alert--error">${UI.esc(err.message)}</div></td></tr>`;
    }
  }

  function openCategoryModal(cat) {
    const f = $('category-form');
    f.reset();
    f.id.value = cat ? cat._id : '';
    $('cm-title').textContent = cat ? 'Edit category' : 'Add category';
    if (cat) {
      f.name.value = cat.name;
      f.type.value = cat.type;
      f.description.value = cat.description || '';
      f.image.value = cat.image || '';
    }
    $('category-modal').classList.add('open');
  }

  async function saveCategory(e) {
    e.preventDefault();
    const f = e.target;
    const payload = {
      name: f.name.value.trim(),
      type: f.type.value,
      description: f.description.value.trim(),
      image: f.image.value.trim(),
    };
    try {
      const data = f.id.value
        ? await api.patch(`/admin/categories/${f.id.value}`, payload)
        : await api.post('/admin/categories', payload);
      toast(data.message);
      $('category-modal').classList.remove('open');
      loadCategories();
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  /* ================= pager helper ================= */
  function renderPager(el, pagination, go) {
    if (!pagination || pagination.totalPages <= 1) {
      el.innerHTML = '';
      return;
    }
    el.innerHTML = `
      <button ${pagination.hasPrev ? '' : 'disabled'} data-go="${pagination.page - 1}">← Prev</button>
      <span class="info">Page ${pagination.page} of ${pagination.totalPages} (${pagination.total} total)</span>
      <button ${pagination.hasNext ? '' : 'disabled'} data-go="${pagination.page + 1}">Next →</button>`;
    el.querySelectorAll('[data-go]').forEach((b) =>
      b.addEventListener('click', () => go(Number(b.dataset.go)))
    );
  }

  /* ================= boot ================= */
  document.addEventListener('DOMContentLoaded', async () => {
    UI.mountNav();
    UI.mountFooter();

    if (!UI.requireAdmin()) return;
    const user = await authStore.refresh();
    if (!user || user.role !== 'admin') return;

    $('loader').classList.add('hidden');
    $('admin-root').classList.remove('hidden');

    document.querySelectorAll('.side-nav button').forEach((b) =>
      b.addEventListener('click', () => switchTab(b.dataset.tab))
    );

    $('btn-add-product').addEventListener('click', () => openProductModal());
    $('btn-add-cat').addEventListener('click', () => openCategoryModal());
    $('product-form').addEventListener('submit', saveProduct);
    // Main-category selects come straight from the store taxonomy.
    fillMainOptions();
    // Cascade: main category -> heading section -> subcategory options.
    $('pm-type').addEventListener('change', (e) => {
      fillHeadings(e.target.value);
      fillSubcategories(e.target.value, $('pm-heading').value);
    });
    $('pm-heading').addEventListener('change', (e) =>
      fillSubcategories($('pm-type').value, e.target.value)
    );
    $('category-form').addEventListener('submit', saveCategory);

    const closeModal = (bd) => {
      bd.classList.remove('open');
      // Closing the product form while "Add New Product" is active returns
      // the admin to the Manage Products tab.
      const activeTab = document.querySelector('.side-nav button.active');
      if (bd.id === 'product-modal' && activeTab && activeTab.dataset.tab === 'add-product') {
        switchTab('products');
      }
    };

    document.querySelectorAll('.modal-backdrop').forEach((bd) => {
      bd.querySelectorAll('[data-close]').forEach((b) =>
        b.addEventListener('click', () => closeModal(bd))
      );
      bd.addEventListener('click', (e) => {
        if (e.target === bd) closeModal(bd);
      });
    });

    // debounced search boxes
    let timer;
    $('prod-search').addEventListener('input', (e) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        prodState.search = e.target.value.trim();
        prodState.page = 1;
        loadProducts();
      }, 350);
    });
    // main-category + subcategory filters for the product list
    TAXONOMY.MAIN.forEach((m) => $('prod-type').add(new Option(m, m)));
    fillSubFilter();
    $('prod-type').addEventListener('change', (e) => {
      prodState.type = e.target.value;
      prodState.category = '';
      prodState.page = 1;
      fillSubFilter();
      loadProducts();
    });
    $('prod-cat').addEventListener('change', (e) => {
      prodState.category = e.target.value;
      prodState.page = 1;
      loadProducts();
    });
    $('ord-search').addEventListener('input', (e) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        ordState.search = e.target.value.trim();
        ordState.page = 1;
        loadOrders();
      }, 350);
    });
    $('ord-status').addEventListener('change', (e) => {
      ordState.status = e.target.value;
      ordState.page = 1;
      loadOrders();
    });

    let invTimer;
    $('inv-search').addEventListener('input', (e) => {
      clearTimeout(invTimer);
      invTimer = setTimeout(() => {
        listState.inventory.search = e.target.value.trim();
        listState.inventory.page = 1;
        loadInventory('inventory');
      }, 350);
    });
    let oosTimer;
    $('oos-search').addEventListener('input', (e) => {
      clearTimeout(oosTimer);
      oosTimer = setTimeout(() => {
        listState.outofstock.search = e.target.value.trim();
        listState.outofstock.page = 1;
        loadInventory('outofstock');
      }, 350);
    });
    $('oos-reason').addEventListener('change', (e) => {
      listState.outofstock.reason = e.target.value;
      listState.outofstock.page = 1;
      loadInventory('outofstock');
    });

    let priceTimer;
    $('price-search').addEventListener('input', (e) => {
      clearTimeout(priceTimer);
      priceTimer = setTimeout(() => {
        priceState.search = e.target.value.trim();
        priceState.page = 1;
        loadPriceList();
      }, 350);
    });

    let newTimer;
    $('new-search').addEventListener('input', (e) => {
      clearTimeout(newTimer);
      newTimer = setTimeout(() => {
        newState.search = e.target.value.trim();
        newState.page = 1;
        loadNewReleases();
      }, 350);
    });
    $('new-filter').addEventListener('change', (e) => {
      newState.filter = e.target.value;
      newState.page = 1;
      loadNewReleases();
    });

    loadDashboard();
    UI.refreshBadges();
  });
})();
