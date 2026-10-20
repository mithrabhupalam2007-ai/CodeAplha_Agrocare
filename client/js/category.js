/**
 * Category page — handles the seven main categories via ?type=… and any
 * subcategory view via &sub=…:
 *
 *   /pages/category.html?type=Seeds                     -> heading sections of subcategory sliders + mixed grid
 *   /pages/category.html?type=Seeds&sub=Vegetable%20Seeds -> filtered subcategory view
 *   /pages/category.html?type=Tapas                     -> single slider of the seven Tapas subcategories
 *
 * The heading structure (heading section -> subcategory cards) comes from
 * the store taxonomy, one sliding carousel per heading section; clicking a
 * subcategory card filters the grid to that subcategory only.
 * Products always come from the database (no hardcoded catalogue). The main
 * category view uses the backend shuffle for a fresh mixed selection on
 * every visit, then pages through it locally with "Load more" so a single
 * selection never repeats a product.
 */
(() => {
  const el = (id) => document.getElementById(id);
  const PAGE = 12;

  let type = null;
  let sub = null;
  let all = []; // fetched, deduped
  let visible = []; // after search + sort
  let shown = 0;

  const SORTS = {
    // "Recommended" keeps the server's order exactly — for the main category
    // view that is the fresh $sample() shuffle, so every visit looks different.
    default: () => 0,
    featured: (a, b) =>
      (b.featured ? 1 : 0) - (a.featured ? 1 : 0) ||
      (b.isNewRelease ? 1 : 0) - (a.isNewRelease ? 1 : 0) ||
      (b.rating || 0) - (a.rating || 0),
    price_asc: (a, b) => a.price - b.price,
    price_desc: (a, b) => b.price - a.price,
    name_asc: (a, b) => a.name.localeCompare(b.name),
    rating: (a, b) => (b.rating || 0) - (a.rating || 0),
  };

  /* ---------------- header + breadcrumbs ---------------- */
  function renderHeader() {
    document.title = `${sub || type} — AgroShield`;
    el('crumb-type').textContent = type;

    if (sub) {
      el('crumb-sub-wrap').classList.remove('hidden');
      el('crumb-sub').textContent = sub;
      el('cat-eyebrow').textContent = type;
      el('cat-title').textContent = sub;
      el('cat-sub').textContent = `Part of ${type} — products loaded live from the store database.`;
      el('cat-hero-img').src = TAXONOMY.subImage(sub);
      el('cat-hero-img').alt = sub;
      el('explore-eyebrow').textContent = type;
      el('explore-title').textContent = sub;
      el('cat-search').placeholder = `Search in ${sub}…`;
    } else {
      const card = TAXONOMY.MAIN_CARDS.find((c) => c.type === type);
      el('cat-eyebrow').textContent = 'Main category';
      el('cat-title').textContent = type;
      el('cat-sub').textContent = card ? card.blurb : '';
      el('cat-hero-img').src = card ? card.image : TAXONOMY.mainImage(type);
      el('cat-hero-img').alt = type;
      el('explore-eyebrow').textContent = 'Explore';
      // Spec: every main category (Tapas included) shows its own
      // subcategories, so the Explore section is always named after it.
      el('explore-title').textContent = `Explore ${type}`;
      el('cat-search').placeholder = `Search in ${type}…`;
    }
  }

  /* ---------------- subcategory heading groups ---------------- */
  /**
   * One sliding carousel per heading section of the taxonomy, in order
   * (Seeds: Horticulture Crops / Field Crops / Special Category, …).
   * Tapas has no headings, so it renders a single ungrouped track.
   */
  function renderSubcats() {
    const subs = TAXONOMY.subcategoriesOf(type);
    // No subcategory carousels inside a sub view, and none if (hypothetically)
    // a category ever ships without subcategories.
    if (sub || !subs.length) return;

    const wrap = el('subcat-groups');
    (TAXONOMY.STRUCTURE[type] || []).forEach((group) => {
      const section = document.createElement('section');
      section.className = 'section section--tight subcat-group';
      const title = group.heading || `${type} — ${group.subcategories.length} subcategories`;
      section.innerHTML = `
        <div class="container">
          <div class="section-head">
            <div>
              <span class="eyebrow">Browse by subcategory</span>
              <h2>${UI.esc(title)}</h2>
            </div>
            <div class="carousel__nav">
              <button class="carousel__btn" type="button" data-prev aria-label="Scroll subcategories left">‹</button>
              <button class="carousel__btn" type="button" data-next aria-label="Scroll subcategories right">›</button>
            </div>
          </div>
          <div class="carousel" data-carousel>
            <div class="carousel__track subcat-track"></div>
          </div>
        </div>`;

      const track = section.querySelector('.subcat-track');
      group.subcategories.forEach((s) => {
        const a = document.createElement('a');
        a.className = 'subcat-card';
        a.href = TAXONOMY.subcategoryUrl(type, s);
        a.innerHTML = `
          <img class="subcat-card__img" src="${UI.esc(TAXONOMY.subImage(s))}" alt="${UI.esc(s)}" loading="lazy" />
          <div class="subcat-card__body">
            <h3>${UI.esc(s)}</h3>
            <span class="subcat-card__go">View products →</span>
          </div>`;
        track.appendChild(a);
      });

      wrap.appendChild(section);
      UI.wireCarousel(section);
    });
  }

  /* ---------------- product fetching ---------------- */
  async function fetchProducts() {
    el('cat-loader').classList.remove('hidden');
    try {
      const params = sub
        ? { type, subcategory: sub, limit: 60 }
        : { type, shuffle: 'true', limit: 60 }; // fresh mixed selection per visit
      const data = await api.get(`/products${api.qs(params)}`);
      // Defensive dedupe — the backend $sample already returns distinct rows.
      const seen = new Set();
      all = (data.products || []).filter((p) => {
        if (seen.has(p._id)) return false;
        seen.add(p._id);
        return true;
      });
    } catch (err) {
      all = [];
      el('cat-grid').innerHTML = `<div class="alert show alert--error">${UI.esc(err.message)}</div>`;
    } finally {
      el('cat-loader').classList.add('hidden');
    }
  }

  /* ---------------- search + sort + paging ---------------- */
  function applyView(reset = true) {
    const q = el('cat-search').value.trim().toLowerCase();
    const sorter = SORTS[el('cat-sort').value] || SORTS.featured;

    visible = all
      .filter((p) => {
        if (!q) return true;
        return (
          p.name.toLowerCase().includes(q) ||
          TAXONOMY.labelFor(p).toLowerCase().includes(q) ||
          (p.heading || '').toLowerCase().includes(q) ||
          (p.brand || '').toLowerCase().includes(q) ||
          (p.packSize || '').toLowerCase().includes(q)
        );
      })
      .slice()
      .sort(sorter);

    if (reset) shown = PAGE;
    renderGrid();
  }

  function renderGrid() {
    const grid = el('cat-grid');
    const empty = el('cat-empty');
    const more = el('cat-more');
    const shownLabel = el('cat-shown');

    grid.innerHTML = '';
    if (!visible.length) {
      grid.classList.add('hidden');
      more.hidden = true;
      shownLabel.textContent = '';
      el('cat-empty-text').textContent = all.length
        ? 'No products match your search in this section.'
        : 'No products have been listed in this section yet. Check back soon!';
      empty.classList.remove('hidden');
      el('cat-count').textContent = all.length ? `${all.length} products` : 'No products yet';
      return;
    }

    empty.classList.add('hidden');
    grid.classList.remove('hidden');

    visible.slice(0, shown).forEach((p) => grid.appendChild(UI.productCard(p, sub || undefined)));

    const shownNow = Math.min(shown, visible.length);
    shownLabel.textContent = `Showing ${shownNow} of ${visible.length} products`;
    more.hidden = shownNow >= visible.length;
    el('cat-count').textContent = `${all.length} product${all.length === 1 ? '' : 's'}${sub ? ` in ${sub}` : ` in ${type}`}`;
  }

  /* ---------------- boot ---------------- */
  document.addEventListener('DOMContentLoaded', async () => {
    UI.mountNav();
    UI.mountFooter();
    if (!UI.requireLogin()) return; // shop is only reachable after login

    const params = new URLSearchParams(location.search);
    type = params.get('type');
    sub = params.get('sub');

    if (!TAXONOMY.MAIN.includes(type)) {
      toast('Unknown category. Redirecting you home.', 'error');
      setTimeout(() => (location.href = '/pages/home.html'), 900);
      return;
    }
    // A subcategory that does not belong to this type falls back to the
    // main category view instead of showing misleading results.
    if (sub && !TAXONOMY.subcategoriesOf(type).includes(sub)) sub = null;

    renderHeader();
    renderSubcats();
    await fetchProducts();
    applyView();

    el('cat-search').addEventListener('input', () => applyView());
    el('cat-sort').addEventListener('change', () => applyView());
    el('cat-more').addEventListener('click', () => {
      shown += PAGE;
      renderGrid();
    });

    if (authStore.isLoggedIn) await authStore.refresh();
    UI.refreshBadges();
  });
})();
