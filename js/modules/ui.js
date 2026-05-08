/**
 * UI module
 * ---------------------------------------------------------------------------
 * Reusable bits of UI shared across pages: site header, toast notifications,
 * formatters. Kept framework-free on purpose — small enough to read.
 */

import { session } from './session.js';
import { cart } from './cart.js';

// ---- Formatters -----------------------------------------------------------

export function formatPrice(value, currency = 'EUR') {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value);
}

// ---- Header ---------------------------------------------------------------

export function renderHeader(activePage = '') {
  const root = document.querySelector('#site-header');
  if (!root) return;

  const update = () => {
    const user = session.user;
    const count = cart.state.itemCount;

    root.innerHTML = `
      <div class="header-inner">
        <a href="/ui/pages/shop/index.html" class="brand" aria-label="Atelier home">
          <span class="brand-mark">A</span>
          <span class="brand-word">Atelier</span>
        </a>

        <nav class="nav" aria-label="Primary">
          <a href="/ui/pages/shop/index.html" class="${activePage === 'shop' ? 'is-active' : ''}">Shop</a>
          <a href="/ui/pages/shop/index.html#about" class="${activePage === 'about' ? 'is-active' : ''}">About</a>
          ${
            session.isAdmin()
              ? `<a href="/ui/pages/admin-dashboard/index.html" class="${activePage === 'admin' ? 'is-active' : ''}">Admin</a>`
              : ''
          }
        </nav>

        <div class="header-actions">
          ${
            user
              ? `
                <span class="user-greet" title="${user.email}">
                  <span class="user-greet-label">Hi,</span>
                  <strong>${escapeHtml(user.name)}</strong>
                </span>
                <button class="btn btn-ghost" data-action="logout">Log out</button>
              `
              : `
                    <a href="/ui/pages/login/index.html" class="btn btn-ghost">Log in</a>
                    <a href="/ui/pages/register/index.html" class="btn btn-quiet">Sign up</a>
              `
          }
                  <a href="/ui/pages/cart/index.html" class="cart-link" aria-label="View cart">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none"
                 stroke="currentColor" stroke-width="1.6" stroke-linecap="round"
                 stroke-linejoin="round" aria-hidden="true">
              <path d="M3 4h2l2.4 12.2a2 2 0 0 0 2 1.6h8.5a2 2 0 0 0 2-1.5L21 8H6"/>
              <circle cx="9" cy="20" r="1.5"/>
              <circle cx="18" cy="20" r="1.5"/>
            </svg>
            ${count > 0 ? `<span class="cart-badge">${count}</span>` : ''}
          </a>
        </div>
      </div>
    `;

    const logoutBtn = root.querySelector('[data-action="logout"]');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        logoutBtn.disabled = true;
        await session.logout();
        await cart.refresh();
        window.location.href = '/ui/pages/shop/index.html';
      });
    }
  };

  session.on('change', update);
  cart.on('change', update);
  update();
}

// ---- Footer ---------------------------------------------------------------

export function renderFooter() {
  const root = document.querySelector('#site-footer');
  if (!root) return;
  root.innerHTML = `
    <div class="footer-inner">
      <div class="footer-col">
        <h4>Atelier</h4>
        <p>Carefully made objects from independent workshops across Europe.</p>
      </div>
      <div class="footer-col">
        <h4>Shop</h4>
        <a href="/ui/pages/shop/index.html">All items</a>
        <a href="/ui/pages/shop/index.html?cat=kitchen">Kitchen</a>
        <a href="/ui/pages/shop/index.html?cat=ceramics">Ceramics</a>
        <a href="/ui/pages/shop/index.html?cat=home">Home</a>
      </div>
      <div class="footer-col">
        <h4>Account</h4>
        <a href="/ui/pages/login/index.html">Log in</a>
        <a href="/ui/pages/register/index.html">Sign up</a>
        <a href="/ui/pages/admin/index.html">Admin portal</a>
      </div>
      <div class="footer-col">
        <h4>Demo</h4>
        <p class="muted">This is a frontend demo with a mock API. See <code>API_REFERENCE.md</code>.</p>
      </div>
    </div>
    <div class="footer-base">
      <span>© ${new Date().getFullYear()} Atelier. All rights reserved.</span>
      <span>Built as a frontend reference.</span>
    </div>
  `;
}

// ---- Toast ----------------------------------------------------------------

let toastRoot = null;
function ensureToastRoot() {
  if (toastRoot) return toastRoot;
  toastRoot = document.createElement('div');
  toastRoot.className = 'toast-root';
  toastRoot.setAttribute('role', 'status');
  toastRoot.setAttribute('aria-live', 'polite');
  document.body.appendChild(toastRoot);
  return toastRoot;
}

export function toast(message, { type = 'info', duration = 3200 } = {}) {
  const root = ensureToastRoot();
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = message;
  root.appendChild(el);
  // trigger CSS animation
  requestAnimationFrame(() => el.classList.add('is-shown'));
  setTimeout(() => {
    el.classList.remove('is-shown');
    el.addEventListener('transitionend', () => el.remove(), { once: true });
  }, duration);
}

// ---- Misc -----------------------------------------------------------------

export function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

/** Run a function once the DOM is parsed (works whether or not the script
 *  is `type="module"` and however late it loads). */
export function onReady(fn) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fn, { once: true });
  } else {
    fn();
  }
}

/**
 * Initialise stuff every page needs: header, footer, session, cart badge.
 * Call once at the top of each page script.
 */
export async function bootstrap(activePage) {
  onReady(async () => {
    renderHeader(activePage);
    renderFooter();
    // Fire these in parallel — neither blocks the other.
    await Promise.all([session.refresh(), cart.refresh()]);
  });
}
