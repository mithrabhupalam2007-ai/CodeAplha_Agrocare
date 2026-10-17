/**
 * AgroShield API client.
 * Single place that knows how to reach the backend and how auth travels.
 *
 * Auth strategy:
 *  - Same origin (site served by Express) -> httpOnly cookie, sent automatically.
 *  - Cross origin (VS Code Live Server)   -> bearer token from localStorage,
 *    sent via the Authorization header (cookie alone can't cross origins
 *    without SameSite=None, which we avoid on purpose).
 */
const Api = (() => {
  const isLocalDevPage = ['5500', '8080', '8000'].includes(location.port);
  const BASE = isLocalDevPage ? 'http://localhost:5050/api' : '/api';
  const TOKEN_KEY = 'agroshield_token';

  const getToken = () => localStorage.getItem(TOKEN_KEY) || '';
  const setToken = (t) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY));

  /** Core request helper. Returns parsed JSON; throws Error(message) on failure. */
  async function request(path, { method = 'GET', body, headers = {} } = {}) {
    const finalHeaders = { ...headers };
    if (body !== undefined) finalHeaders['Content-Type'] = 'application/json';
    const token = getToken();
    if (token) finalHeaders.Authorization = `Bearer ${token}`;

    let res;
    try {
      res = await fetch(`${BASE}${path}`, {
        method,
        credentials: 'include',
        headers: finalHeaders,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    } catch (err) {
      throw new Error('Cannot reach the server. Please make sure the backend is running.');
    }

    let data = null;
    try {
      data = await res.json();
    } catch (err) {
      data = null;
    }

    if (!res.ok) {
      const message = (data && data.message) || `Request failed (${res.status})`;
      const error = new Error(message);
      error.status = res.status;
      throw error;
    }
    return data;
  }

  const get = (path) => request(path);
  const post = (path, body) => request(path, { method: 'POST', body });
  const patch = (path, body) => request(path, { method: 'PATCH', body });
  const del = (path) => request(path, { method: 'DELETE' });

  /** Convenience helpers for the flows used across pages. */
  return {
    get,
    post,
    patch,
    del,
    getToken,
    setToken,
    /** Turn an object into a query string, skipping empty values. */
    qs(params = {}) {
      const q = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v === undefined || v === null || v === '' || v === false) return;
        q.set(k, v);
      });
      const s = q.toString();
      return s ? `?${s}` : '';
    },
  };
})();

/* Tiny sugar so pages can just say `await api.get(...)`. */
const api = Api;
