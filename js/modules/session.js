/**
 * Session module
 * ---------------------------------------------------------------------------
 * Single source of truth for "who is logged in right now". Other modules
 * subscribe via session.on('change', ...) so the header, cart badge, etc.
 * stay in sync without each one polling /auth/me.
 *
 * This module deliberately holds no UI logic — it only owns the user state
 * and notifies subscribers when it changes.
 */

import { api } from '../api/client.js';

const listeners = new Set();
const state = {
  user: null,
  ready: false, // becomes true after first me() resolves
};

function emit() {
  for (const fn of listeners) fn(state);
}

export const session = {
  /** Current user object, or null. */
  get user() {
    return state.user;
  },

  /** Has the initial /auth/me check resolved? */
  get ready() {
    return state.ready;
  },

  isLoggedIn() {
    return !!state.user;
  },

  isAdmin() {
    return state.user?.role === 'admin';
  },

  /** Subscribe to changes. Returns an unsubscribe function. */
  on(_event, fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },

  /** Pull the current user from the server (call once on page load). */
  async refresh() {
    try {
      const { user } = await api.me();
      state.user = user;
    } catch {
      state.user = null;
    } finally {
      state.ready = true;
      emit();
    }
    return state.user;
  },

  async login(credentials) {
    const result = await api.login(credentials);
    state.user = result.user;
    state.ready = true;
    emit();
    return result;
  },

  async register(payload) {
    const result = await api.register(payload);
    state.user = result.user;
    state.ready = true;
    emit();
    return result;
  },

  async adminLogin(credentials) {
    const result = await api.adminLogin(credentials);
    state.user = result.user;
    state.ready = true;
    emit();
    return result;
  },

  async logout() {
    await api.logout();
    state.user = null;
    emit();
  },
};
