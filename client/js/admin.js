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
      $('s-customers').textContent = s.totalCustomers.toLocaleString('en-IN');
      $('s-products').textContent = s.totalProducts.toLocaleString('en-IN');
      $('s-products-sub').textContent = `${s.activeProducts} active · ${s.inactiveProducts} inactive`;
      $('s-instock').textContent = (s.inStockProducts ?? 0).toLocaleString('en-IN');
      $('s-oos').textContent = (s.outOfStockProducts ?? 0).toLocaleString('en-IN');
      $('oos-card').classList.toggle('alerted', (s.outOfStockProducts || 0) > 0);
      $('s-users').textContent = (s.totalUsers ?? s.totalCustomers).toLocaleString('en-IN');
      $('s-users-sub').textContent = `${s.totalCustomers} customer(s)`;
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
  const prodState = { page: 1, search: '', category: '' };

  async function loadProducts() {
    const tbody = $('prod-table');
    tbody.innerHTML = '<tr><td colspan="7"><div class="spinner"></div></td></tr>';
    try {
      const [data, cats] = await Promise.all([
        // /admin/products also returns inactive items, so admins can manage everything.
        api.get(
          '/admin/products' +
            api.qs({ search: prodState.search, category: prodState.category, page: prodState.page, limit: 10 })
        ),
        api.get('/admin/categories'),
      ]);

      // category dropdowns (filters + modal)
      const filterSel = $('prod-cat');
      const modalSel = $('pm-category');
      if (filterSel.options.length === 1) {
        cats.categories.forEach((c) => {
          filterSel.add(new Option(c.name, c.name));
          modalSel.add(new Option(c.name, c.name));
        });
      }

      tbody.innerHTML = data.products.length
        ? data.products
            .map(
              (p) => `
        <tr>
          <td><img src="${UI.esc(p.image)}" alt="" /></td>
          <td><b>${UI.esc(p.name)}</b><br/><span class="text-muted" style="font-size:.78rem;">${UI.esc(p.brand)} · ${UI.esc(p.packSize)}</span>${p.isDemoData ? ' <span class="badge badge--amber">demo</span>' : ''}</td>
          <td>${UI.esc(p.category)}</td>
          <td><b>${UI.inr(p.price)}</b></td>
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

  function openProductModal(id) {
    const form = $('product-form');
    form.reset();
    form.id.value = '';
    $('pm-title').textContent = 'Add product';
    form.active.checked = true;

    if (id) {
      $('pm-title').textContent = 'Edit product';
      api
        .get(`/products/${id}`)
        .then(({ product }) => {
          form.id.value = product._id;
          form.name.value = product.name;
          form.description.value = product.description;
          form.category.value = product.category;
          form.type.value = product.type;
          form.brand.value = product.brand;
          form.packSize.value = product.packSize;
          form.price.value = product.price;
          form.stockQuantity.value = product.stockQuantity;
          form.image.value = product.image;
          form.crops.value = (product.crops || []).join(', ');
          form.featured.checked = !!product.featured;
          form.bestseller.checked = !!product.bestseller;
          form.seasonal.checked = !!product.seasonal;
          form.active.checked = !!product.active;
        })
        .catch((err) => toast(err.message, 'error'));
    }
    $('product-modal').classList.add('open');
  }

  async function saveProduct(e) {
    e.preventDefault();
    const f = e.target;
    const payload = {
      name: f.name.value.trim(),
      description: f.description.value.trim(),
      category: f.category.value,
      type: f.type.value,
      brand: f.brand.value.trim(),
      packSize: f.packSize.value.trim(),
      price: Number(f.price.value),
      stockQuantity: Number(f.stockQuantity.value),
      image: f.image.value.trim(),
      crops: f.crops.value.split(',').map((c) => c.trim()).filter(Boolean),
      featured: f.featured.checked,
      bestseller: f.bestseller.checked,
      seasonal: f.seasonal.checked,
      active: f.active.checked,
    };

    try {
      const data = f.id.value
        ? await api.patch(`/products/${f.id.value}`, payload)
        : await api.post('/products', payload);
      toast(data.message);
      $('product-modal').classList.remove('open');
      const activeTab = document.querySelector('.side-nav button.active');
      if (activeTab && activeTab.dataset.tab === 'add-product') switchTab('products');
      else loadProducts();
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  /* ================= inventory / out-of-stock ================= */
  const listState = {
    inventory: { page: 1, search: '' },
    outofstock: { page: 1, search: '' },
  };

  function stockBadge(qty) {
    if (qty <= 0) return '<span class="badge badge--red">Out of stock</span>';
    if (qty <= 5) return `<span class="badge badge--amber">${qty} left</span>`;
    return `<span class="badge badge--green">${qty} in stock</span>`;
  }

  async function loadInventory(view) {
    const isOOS = view === 'outofstock';
    const st = listState[view];
    const tbody = $(isOOS ? 'oos-table' : 'inv-table');
    tbody.innerHTML = `<tr><td colspan="${isOOS ? 6 : 7}"><div class="spinner"></div></td></tr>`;

    try {
      const data = await api.get(
        '/admin/products' +
          api.qs({
            status: isOOS ? 'outofstock' : '',
            search: st.search,
            page: st.page,
            limit: 12,
          })
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
                    <button class="btn btn--primary btn--sm" data-stock-save="${p._id}" data-name="${UI.esc(p.name)}">Update</button>
                  </div>
                </td>`;
              const editBtn = `<button class="btn btn--ghost btn--sm" data-edit="${p._id}">Edit</button>`;

              if (isOOS) {
                return `<tr>
                  ${img}${name}<td>${UI.esc(p.category)}</td>${price}
                  ${stockInput}
                  <td><div class="cell-actions">${editBtn}</div></td>
                </tr>`;
              }
              return `<tr>
                ${img}${name}${price}${stockInput}
                <td>${stockBadge(p.stockQuantity)}</td>
                <td><span class="badge ${p.active ? 'badge--green' : 'badge--grey'}">${p.active ? 'Active' : 'Inactive'}</span></td>
                <td><div class="cell-actions">${editBtn}</div></td>
              </tr>`;
            })
            .join('')
        : `<tr><td colspan="${isOOS ? 6 : 7}" class="text-center text-muted" style="padding:30px;">${
            isOOS ? 'Nice — no products are out of stock right now.' : 'No products match your search.'
          }</td></tr>`;

      renderPager($(isOOS ? 'oos-pager' : 'inv-pager'), data.pagination, (p) => {
        st.page = p;
        loadInventory(view);
      });

      tbody.querySelectorAll('[data-stock-save]').forEach((b) =>
        b.addEventListener('click', () => updateStock(b.dataset.stockSave, b.dataset.name, view))
      );
      tbody.querySelectorAll('[data-edit]').forEach((b) =>
        b.addEventListener('click', () => openProductModal(b.dataset.edit))
      );
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="${isOOS ? 6 : 7}"><div class="alert show alert--error">${UI.esc(err.message)}</div></td></tr>`;
    }
  }

  async function updateStock(id, name, view) {
    const input = document.querySelector(`[data-stock-input="${id}"]`);
    const qty = Number(input ? input.value : NaN);
    if (!Number.isInteger(qty) || qty < 0) {
      toast('Stock must be a whole number of 0 or more.', 'error');
      return;
    }
    try {
      const data = await api.patch(`/products/${id}`, { stockQuantity: qty });
      toast(`${name}: stock set to ${qty}`);
      loadInventory(view);
      if (view === 'outofstock' && qty > 0) toast(`${name} is back in stock ✓`);
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

    loadDashboard();
    UI.refreshBadges();
  });
})();
