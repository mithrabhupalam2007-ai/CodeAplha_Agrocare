/**
 * Client-side stores: cart (localStorage) + wishlist sync + auth cache.
 *
 * The cart is a guest-friendly local cart; prices are NEVER trusted from
 * here — the checkout endpoint reloads prices from MongoDB and recomputes
 * every total server-side.
 */
const Store = (() => {
  const CART_KEY = 'agroshield_cart_v1';
  const USER_KEY = 'agroshield_user';

  /* ---------------- cart ---------------- */
  function readCart() {
    try {
      const raw = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
      return Array.isArray(raw) ? raw.filter((i) => i && i.id && i.qty > 0) : [];
    } catch (e) {
      return [];
    }
  }

  function writeCart(items) {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    document.dispatchEvent(new CustomEvent('cart:changed'));
  }

  const Cart = {
    items: readCart,
    count: () => readCart().reduce((n, i) => n + i.qty, 0),
    subtotal: () => Math.round(readCart().reduce((s, i) => s + i.price * i.qty, 0) * 100) / 100,

    /** Add (or merge) a product. `product` = {id,name,price,packSize,image,stock,category} */
    add(product, qty = 1) {
      const items = readCart();
      const found = items.find((i) => i.id === product.id);
      const max = Number.isFinite(product.stock) ? product.stock : 999;
      if (found) found.qty = Math.min(found.qty + qty, max);
      else items.push({ ...product, qty: Math.min(qty, max) });
      writeCart(items);
      return found ? found.qty : qty;
    },

    setQty(id, qty) {
      let items = readCart();
      const it = items.find((i) => i.id === id);
      if (it) {
        if (qty <= 0) items = items.filter((i) => i.id !== id);
        else it.qty = qty;
      }
      writeCart(items);
    },

    remove(id) {
      writeCart(readCart().filter((i) => i.id !== id));
    },

    clear() {
      writeCart([]);
    },

    /** Payload the checkout endpoint expects (ids + qty only). */
    toPayload() {
      return readCart().map((i) => ({ product: i.id, quantity: i.qty }));
    },
  };

  /* ---------------- auth cache ---------------- */
  const Auth = {
    get user() {
      try {
        return JSON.parse(localStorage.getItem(USER_KEY) || 'null');
      } catch (e) {
        return null;
      }
    },
    set user(u) {
      if (u) localStorage.setItem(USER_KEY, JSON.stringify(u));
      else localStorage.removeItem(USER_KEY);
    },
    get isLoggedIn() {
      return Boolean(this.user) || Boolean(api.getToken());
    },
    get isAdmin() {
      return this.user && this.user.role === 'admin';
    },
    /** GET /api/auth/me — refreshes the cache; clears it when the session died. */
    async refresh() {
      if (!api.getToken() && !this.user) return null;
      try {
        const data = await api.get('/auth/me');
        const changed = JSON.stringify(this.user) !== JSON.stringify(data.user);
        this.user = data.user;
        if (changed) document.dispatchEvent(new CustomEvent('auth:changed'));
        return data.user;
      } catch (e) {
        if (e.status === 401) {
          const hadUser = Boolean(this.user);
          this.user = null;
          api.setToken('');
          if (hadUser) document.dispatchEvent(new CustomEvent('auth:changed'));
        }
        return null;
      }
    },
    async logout() {
      try {
        await api.post('/auth/logout');
      } catch (e) {
        /* cookie may already be gone — local cleanup still runs */
      }
      this.user = null;
      api.setToken('');
      document.dispatchEvent(new CustomEvent('auth:changed'));
    },
  };

  return { Cart, Auth };
})();

const cart = Store.Cart;
const authStore = Store.Auth;
