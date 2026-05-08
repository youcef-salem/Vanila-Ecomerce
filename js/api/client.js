/**
 * API Client
 * ---------------------------------------------------------------------------
 * Single entry point for all server communication. Every method returns a
 * Promise and mirrors the REST contract documented in API_REFERENCE.md.
 *
 * Today this file dispatches to a local mock layer (mock-data.js + a tiny
 * persistence layer in localStorage). To swap to a real backend:
 *
 *   1. Set USE_MOCK to false.
 *   2. Set BASE_URL to your live API.
 *   3. Make sure your real API matches the request/response shapes documented
 *      in API_REFERENCE.md.
 *
 * No other file in the codebase imports mock-data directly — they all go
 * through this client, which keeps the swap to a real backend trivial.
 */

import { MOCK_PRODUCTS, MOCK_CATEGORIES, MOCK_USERS } from './mock-data.js';

// ---- Configuration ---------------------------------------------------------

const USE_MOCK = true;
const BASE_URL = '/api'; // change to e.g. 'https://api.atelier.shop/v1' when live
const NETWORK_DELAY_MS = 250; // simulate latency for realism

// ---- Persistence (mock backend state) --------------------------------------
//
// The real backend would persist this to a database. We keep it in
// localStorage so refreshes don't wipe carts / sessions / new admin items.

const STORAGE_KEYS = {
  products: 'atelier.products',
  users: 'atelier.users',
  sessions: 'atelier.sessions', // sessionId -> userId map (server-side store)
  carts: 'atelier.carts', // userId or guestId -> cart items
};

function loadStore(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveStore(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// Seed the mock backend on first load.
function ensureSeeded() {
  if (!localStorage.getItem(STORAGE_KEYS.products)) {
    saveStore(STORAGE_KEYS.products, MOCK_PRODUCTS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.users)) {
    saveStore(STORAGE_KEYS.users, MOCK_USERS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.sessions)) {
    saveStore(STORAGE_KEYS.sessions, {});
  }
  if (!localStorage.getItem(STORAGE_KEYS.carts)) {
    saveStore(STORAGE_KEYS.carts, {});
  }
}
ensureSeeded();

// ---- Helpers ---------------------------------------------------------------

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function uid(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

// ---- Cookies (session token transport) -------------------------------------
//
// The session cookie is the *transport* — the actual session data lives in
// the mock "server" (STORAGE_KEYS.sessions). A real backend would set this
// cookie HttpOnly + Secure; here we use a regular cookie so JS can demo it.

const SESSION_COOKIE = 'atelier_sid';

function setCookie(name, value, days = 7) {
  const expires = new Date(Date.now() + days * 86400000).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function getCookie(name) {
  const match = document.cookie.match(new RegExp(`(^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[2]) : null;
}

function clearCookie(name) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}

function currentSessionUser() {
  const sid = getCookie(SESSION_COOKIE);
  if (!sid) return null;
  const sessions = loadStore(STORAGE_KEYS.sessions, {});
  const userId = sessions[sid];
  if (!userId) return null;
  const users = loadStore(STORAGE_KEYS.users, []);
  return users.find((u) => u.id === userId) || null;
}

// ---- Real-network adapter (used when USE_MOCK is false) --------------------

async function realRequest(method, path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    credentials: 'include', // send/receive the session cookie
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(res.status, data.message || res.statusText, data);
  }
  return data;
}

// ===========================================================================
//                              PUBLIC API
// ===========================================================================

export const api = {
  // ---- Products ----------------------------------------------------------

  /**
   * GET /api/products?search=&category=&minPrice=&maxPrice=&sort=
   * Returns all products matching the filters.
   */
  async listProducts(filters = {}) {
    if (!USE_MOCK) return realRequest('GET', `/products${qs(filters)}`);
    await sleep(NETWORK_DELAY_MS);

    let products = loadStore(STORAGE_KEYS.products, []);
    const { search, category, minPrice, maxPrice, sort } = filters;

    if (search) {
      const q = search.toLowerCase();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          (p.tags || []).some((t) => t.toLowerCase().includes(q)),
      );
    }
    if (category && category !== 'all') {
      products = products.filter((p) => p.category === category);
    }
    if (typeof minPrice === 'number') {
      products = products.filter((p) => p.price >= minPrice);
    }
    if (typeof maxPrice === 'number') {
      products = products.filter((p) => p.price <= maxPrice);
    }

    switch (sort) {
      case 'price-asc':
        products.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        products.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'rating':
        products.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
    }

    return { items: products, total: products.length };
  },

  /** GET /api/products/:id */
  async getProduct(id) {
    if (!USE_MOCK) return realRequest('GET', `/products/${id}`);
    await sleep(NETWORK_DELAY_MS);
    const products = loadStore(STORAGE_KEYS.products, []);
    const product = products.find((p) => p.id === id);
    if (!product) throw new ApiError(404, 'Product not found');
    return product;
  },

  /** GET /api/categories */
  async listCategories() {
    if (!USE_MOCK) return realRequest('GET', '/categories');
    await sleep(80);
    return { items: MOCK_CATEGORIES };
  },

  // ---- Auth -------------------------------------------------------------

  /** POST /api/auth/register  { email, password, name } */
  async register({ email, password, name }) {
    if (!USE_MOCK) return realRequest('POST', '/auth/register', { email, password, name });
    await sleep(NETWORK_DELAY_MS);

    const users = loadStore(STORAGE_KEYS.users, []);
    if (users.find((u) => u.email.toLowerCase() === email.toLowerCase())) {
      throw new ApiError(409, 'An account with that email already exists.');
    }
    const user = {
      id: uid('u'),
      email,
      password,
      name: name || email.split('@')[0],
      role: 'customer',
      createdAt: new Date().toISOString(),
    };
    users.push(user);
    saveStore(STORAGE_KEYS.users, users);
    // Auto-login after registration.
    return this._issueSession(user);
  },

  /** POST /api/auth/login  { email, password } */
  async login({ email, password }) {
    if (!USE_MOCK) return realRequest('POST', '/auth/login', { email, password });
    await sleep(NETWORK_DELAY_MS);

    const users = loadStore(STORAGE_KEYS.users, []);
    const user = users.find(
      (u) =>
        u.email.toLowerCase() === email.toLowerCase() && u.password === password,
    );
    if (!user) throw new ApiError(401, 'Invalid email or password.');
    return this._issueSession(user);
  },

  /** POST /api/auth/admin/login  (admin gate) */
  async adminLogin({ email, password }) {
    if (!USE_MOCK) return realRequest('POST', '/auth/admin/login', { email, password });
    const result = await this.login({ email, password });
    if (result.user.role !== 'admin') {
      // Roll back the session — non-admin can't use the admin gate.
      await this.logout();
      throw new ApiError(403, 'This account does not have admin privileges.');
    }
    return result;
  },

  /** POST /api/auth/logout */
  async logout() {
    if (!USE_MOCK) {
      const r = await realRequest('POST', '/auth/logout');
      clearCookie(SESSION_COOKIE);
      return r;
    }
    await sleep(80);
    const sid = getCookie(SESSION_COOKIE);
    if (sid) {
      const sessions = loadStore(STORAGE_KEYS.sessions, {});
      delete sessions[sid];
      saveStore(STORAGE_KEYS.sessions, sessions);
    }
    clearCookie(SESSION_COOKIE);
    return { ok: true };
  },

  /** GET /api/auth/me  -> current user or null */
  async me() {
    if (!USE_MOCK) {
      try {
        return await realRequest('GET', '/auth/me');
      } catch (e) {
        if (e.status === 401) return { user: null };
        throw e;
      }
    }
    await sleep(40);
    const user = currentSessionUser();
    if (!user) return { user: null };
    return { user: publicUser(user) };
  },

  /** Internal: create a session row + set the cookie. */
  _issueSession(user) {
    const sid = uid('sess');
    const sessions = loadStore(STORAGE_KEYS.sessions, {});
    sessions[sid] = user.id;
    saveStore(STORAGE_KEYS.sessions, sessions);
    setCookie(SESSION_COOKIE, sid, 7);
    return { user: publicUser(user), sessionId: sid };
  },

  // ---- Cart -------------------------------------------------------------

  /** GET /api/cart */
  async getCart() {
    if (!USE_MOCK) return realRequest('GET', '/cart');
    await sleep(80);
    const ownerId = cartOwnerId();
    const carts = loadStore(STORAGE_KEYS.carts, {});
    const items = carts[ownerId] || [];
    return enrichCart(items);
  },

  /** POST /api/cart/items  { productId, quantity } */
  async addToCart(productId, quantity = 1) {
    if (!USE_MOCK) return realRequest('POST', '/cart/items', { productId, quantity });
    await sleep(120);
    const ownerId = cartOwnerId();
    const carts = loadStore(STORAGE_KEYS.carts, {});
    const items = carts[ownerId] || [];

    const existing = items.find((i) => i.productId === productId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      items.push({ productId, quantity });
    }
    carts[ownerId] = items;
    saveStore(STORAGE_KEYS.carts, carts);
    return enrichCart(items);
  },

  /** PUT /api/cart/items/:productId  { quantity } */
  async updateCartItem(productId, quantity) {
    if (!USE_MOCK) return realRequest('PUT', `/cart/items/${productId}`, { quantity });
    await sleep(80);
    const ownerId = cartOwnerId();
    const carts = loadStore(STORAGE_KEYS.carts, {});
    let items = carts[ownerId] || [];

    if (quantity <= 0) {
      items = items.filter((i) => i.productId !== productId);
    } else {
      const item = items.find((i) => i.productId === productId);
      if (item) item.quantity = quantity;
    }
    carts[ownerId] = items;
    saveStore(STORAGE_KEYS.carts, carts);
    return enrichCart(items);
  },

  /** DELETE /api/cart/items/:productId */
  async removeFromCart(productId) {
    if (!USE_MOCK) return realRequest('DELETE', `/cart/items/${productId}`);
    return this.updateCartItem(productId, 0);
  },

  /** DELETE /api/cart  -> empty cart */
  async clearCart() {
    if (!USE_MOCK) return realRequest('DELETE', '/cart');
    await sleep(80);
    const ownerId = cartOwnerId();
    const carts = loadStore(STORAGE_KEYS.carts, {});
    carts[ownerId] = [];
    saveStore(STORAGE_KEYS.carts, carts);
    return enrichCart([]);
  },

  // ---- Admin ------------------------------------------------------------

  /** POST /api/admin/products  (admin only) */
  async createProduct(payload) {
    if (!USE_MOCK) return realRequest('POST', '/admin/products', payload);
    await sleep(NETWORK_DELAY_MS);
    requireAdmin();

    const products = loadStore(STORAGE_KEYS.products, []);
    const product = {
      id: uid('p'),
      slug: slugify(payload.name),
      currency: 'EUR',
      rating: 0,
      reviews: 0,
      createdAt: new Date().toISOString(),
      images: payload.image ? [payload.image] : [],
      tags: payload.tags || [],
      ...payload,
    };
    products.unshift(product);
    saveStore(STORAGE_KEYS.products, products);
    return product;
  },

  /** PUT /api/admin/products/:id */
  async updateProduct(id, payload) {
    if (!USE_MOCK) return realRequest('PUT', `/admin/products/${id}`, payload);
    await sleep(NETWORK_DELAY_MS);
    requireAdmin();
    const products = loadStore(STORAGE_KEYS.products, []);
    const idx = products.findIndex((p) => p.id === id);
    if (idx === -1) throw new ApiError(404, 'Product not found');
    products[idx] = { ...products[idx], ...payload };
    saveStore(STORAGE_KEYS.products, products);
    return products[idx];
  },

  /** DELETE /api/admin/products/:id */
  async deleteProduct(id) {
    if (!USE_MOCK) return realRequest('DELETE', `/admin/products/${id}`);
    await sleep(NETWORK_DELAY_MS);
    requireAdmin();
    let products = loadStore(STORAGE_KEYS.products, []);
    const before = products.length;
    products = products.filter((p) => p.id !== id);
    if (products.length === before) throw new ApiError(404, 'Product not found');
    saveStore(STORAGE_KEYS.products, products);
    return { ok: true };
  },
};

// ---- Internal helpers ------------------------------------------------------

function publicUser(u) {
  // Never return password hashes / sensitive fields to the client.
  const { password, ...safe } = u;
  return safe;
}

function cartOwnerId() {
  // Logged-in users get a stable cart keyed by user id.
  // Guests get a per-browser cart keyed by a "guest" cookie.
  const user = currentSessionUser();
  if (user) return `user:${user.id}`;

  let guestId = getCookie('atelier_guest');
  if (!guestId) {
    guestId = uid('guest');
    setCookie('atelier_guest', guestId, 30);
  }
  return `guest:${guestId}`;
}

function enrichCart(items) {
  const products = loadStore(STORAGE_KEYS.products, []);
  const enriched = items
    .map((it) => {
      const p = products.find((p) => p.id === it.productId);
      if (!p) return null;
      return {
        productId: p.id,
        name: p.name,
        price: p.price,
        currency: p.currency,
        image: p.image,
        quantity: it.quantity,
        subtotal: +(p.price * it.quantity).toFixed(2),
      };
    })
    .filter(Boolean);

  const subtotal = +enriched.reduce((s, i) => s + i.subtotal, 0).toFixed(2);
  const itemCount = enriched.reduce((s, i) => s + i.quantity, 0);
  return { items: enriched, subtotal, itemCount, currency: 'EUR' };
}

function requireAdmin() {
  const user = currentSessionUser();
  if (!user || user.role !== 'admin') {
    throw new ApiError(403, 'Admin access required.');
  }
}

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function qs(obj) {
  const entries = Object.entries(obj).filter(
    ([, v]) => v !== undefined && v !== null && v !== '',
  );
  if (!entries.length) return '';
  return '?' + new URLSearchParams(entries).toString();
}

export { ApiError };
