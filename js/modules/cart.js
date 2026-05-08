/**
 * Cart module
 * ---------------------------------------------------------------------------
 * Wraps the cart API and notifies subscribers whenever the cart changes,
 * so the header badge updates everywhere without prop drilling.
 */

import { api } from '../api/client.js';

const listeners = new Set();
let state = {
  items: [],
  subtotal: 0,
  itemCount: 0,
  currency: 'EUR',
  loading: false,
};

function emit() {
  for (const fn of listeners) fn(state);
}

function applyCartResponse(cart) {
  state = { ...state, ...cart, loading: false };
  emit();
  return state;
}

export const cart = {
  get state() {
    return state;
  },

  on(_event, fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },

  async refresh() {
    state = { ...state, loading: true };
    emit();
    const c = await api.getCart();
    return applyCartResponse(c);
  },

  async add(productId, quantity = 1) {
    const c = await api.addToCart(productId, quantity);
    return applyCartResponse(c);
  },

  async update(productId, quantity) {
    const c = await api.updateCartItem(productId, quantity);
    return applyCartResponse(c);
  },

  async remove(productId) {
    const c = await api.removeFromCart(productId);
    return applyCartResponse(c);
  },

  async clear() {
    const c = await api.clearCart();
    return applyCartResponse(c);
  },
};
