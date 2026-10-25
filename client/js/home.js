/**
 * Home page: hero-adjacent main-category carousel (seven categories),
 * featured / seasonal / seed / crop-protection / equipment product rails
 * with honest labelled fallbacks, newsletter.
 */
(() => {
  function skeleton(container) {
    container.innerHTML = '<div class="skeleton skeleton-card"></div>'.repeat(4);
  }

  async function loadProducts(gridId, params, opts = {}) {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    skeleton(grid);
    try {
      let data = await api.get(`/products${api.qs(params)}`);
      let products = data.products;
      // No products carry this merchandising flag (all demo flags were removed)
      // — fall back to honest catalogue picks with a clearly-labelled note.
      if (!products.length && opts.fallback) {
        data = await api.get(`/products${api.qs(opts.fallback)}`);
        products = data.products;
        if (products.length && opts.noteId) {
          const note = document.getElementById(opts.noteId);
          if (note) {
            note.querySelector('span').textContent = opts.note;
            note.classList.remove('hidden');
          }
        }
      }
      grid.innerHTML = '';
      if (!products.length) {
        grid.innerHTML = '<p class="text-muted">No products found in this section yet.</p>';
        return;
      }
      products.forEach((p) => grid.appendChild(UI.productCard(p)));
    } catch (err) {
      grid.innerHTML = `<div class="alert show alert--error">${UI.esc(err.message)}</div>`;
    }
  }

  /* ---------------- main category sliding cards ---------------- */
  function renderMainCategories() {
    const track = document.getElementById('main-cat-track');
    if (!track) return;
    const activeType = new URLSearchParams(location.search).get('type');

    TAXONOMY.MAIN_CARDS.forEach((c) => {
      const a = document.createElement('a');
      a.className = `mcat-card${c.type === activeType ? ' on' : ''}`;
      a.href = c.href;
      a.innerHTML = `
        <img class="mcat-card__img" src="${UI.esc(c.image)}" alt="${UI.esc(c.type)}" loading="lazy" />
        <div class="mcat-card__body">
          <h3>${UI.esc(c.type)}</h3>
          <p>${UI.esc(c.blurb)}</p>
          <span class="mcat-card__go">Explore →</span>
        </div>`;
      track.appendChild(a);
    });
    UI.wireCarousel(document.getElementById('main-cat-carousel'));
  }

  /* ---------------- seasonal products ---------------- */
  async function loadSeasonal() {
    const track = document.getElementById('seasonal-track');
    if (!track) return;
    skeleton(track);
    try {
      const data = await api.get('/products/seasonal?limit=8');
      track.innerHTML = '';

      const note = document.getElementById('seasonal-note');
      const empty = document.getElementById('seasonal-empty');
      const carousel = document.getElementById('seasonal-carousel');

      if (!data.products.length) {
        // Nothing is flagged seasonal — show clearly-labelled popular picks
        // from the real catalogue instead (never invented/demo products).
        if (data.demoFallback) {
          const alt = await api.get('/products?limit=8&sort=rating');
          if (alt.products.length) {
            note.querySelector('span').textContent =
              'No seasonal products have been configured yet — these are popular picks from the catalogue instead.';
            note.classList.remove('hidden');
            alt.products.forEach((p) => {
              const card = UI.productCard(p);
              card.classList.add('carousel__card');
              track.appendChild(card);
            });
            UI.wireCarousel(carousel.parentElement);
            return;
          }
        }
        carousel.classList.add('hidden');
        empty.classList.remove('hidden');
        return;
      }

      if (data.demoFallback) {
        // No administrator has configured seasonal products yet — show a
        // clearly-labelled note above popular picks (no invented seasonality).
        note.querySelector('span').textContent =
          'No seasonal products have been configured yet — these are popular picks from the catalogue instead.';
        note.classList.remove('hidden');
      }

      data.products.forEach((p) => {
        const card = UI.productCard(p);
        card.classList.add('carousel__card');
        track.appendChild(card);
      });
      UI.wireCarousel(carousel.parentElement);
    } catch (err) {
      track.innerHTML = `<div class="alert show alert--error">${UI.esc(err.message)}</div>`;
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
      data.products.forEach((p) => grid.appendChild(UI.productCard(p)));
    } catch (err) {
      grid.innerHTML = `<div class="alert show alert--error">${UI.esc(err.message)}</div>`;
    }
  }

  document.addEventListener('DOMContentLoaded', async () => {
    UI.mountNav();
    UI.mountFooter();
    if (!UI.requireLogin()) return; // shop is only reachable after login
    wireNewsletter();

    renderMainCategories();
    loadSeasonal();
    loadNewReleases();
    loadProducts('featured-grid', { featured: true, limit: 4, sort: 'featured' }, {
      fallback: { limit: 4, sort: 'rating' },
      noteId: 'featured-note',
      note: 'No products are flagged as featured yet — these are top-rated picks from the catalogue instead.',
    });
    loadProducts('seed-grid', { type: 'Seeds', bestseller: true, limit: 4, sort: 'rating' }, {
      fallback: { type: 'Seeds', limit: 4, sort: 'rating' },
      noteId: 'seed-note',
      note: 'No seed bestsellers have been flagged yet — these top-rated seeds from the catalogue are shown instead.',
    });
    loadProducts('crop-grid', { type: 'Crop Protection', limit: 4, sort: 'rating' });
    loadProducts('recent-grid', { limit: 4, sort: 'newest' });
    loadProducts('essentials-grid', { type: 'Equipments', limit: 4, sort: 'featured' });

    if (authStore.isLoggedIn) await authStore.refresh();
    UI.refreshBadges();
  });
})();
