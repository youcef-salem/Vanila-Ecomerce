/**
 * Cart page
 */

import { cart } from '../../../logic/modules/cart.js';
import { session } from '../../../logic/modules/session.js';
import { bootstrap, formatPrice, escapeHtml, toast, onReady } from '../../../logic/modules/ui.js';

bootstrap('cart');

onReady(async () => {
  // The bootstrap() call already triggers cart.refresh(), but cart.on('change')
  // ensures we re-render whenever the bootstrap refresh resolves OR when an
  // item changes from any other interaction.
  cart.on('change', renderPage);
  renderPage(cart.state);
});

function renderPage(state) {
  const root = document.querySelector('#cart-root');
  if (!root) return;

  if (state.loading && !state.items.length) {
    root.innerHTML = `<p class="muted" style="text-align:center;padding:3rem">Loading cart…</p>`;
    return;
  }

  if (!state.items.length) {
    root.innerHTML = `
      <header><h1>Your cart</h1></header>
      <div class="cart-empty">
        <h2>Your cart is empty.</h2>
        <p>Start by browsing what's in stock.</p>
        <a class="btn btn-primary" href="/ui/pages/shop/index.html">Browse shop</a>
      </div>
    `;
    return;
  }

  root.innerHTML = `
    <header>
      <span class="eyebrow">Cart</span>
      <h1>Your selection</h1>
      <p class="muted" style="margin-top:0.5rem">
        ${state.itemCount} ${state.itemCount === 1 ? 'item' : 'items'}
      </p>
    </header>

    <div class="cart-page-grid">
      <div class="cart-list">
        ${state.items.map(renderItem).join('')}
        <div style="display:flex;justify-content:flex-end;padding-top:1.5rem">
          <button class="btn btn-quiet" id="clear-cart">Clear cart</button>
        </div>
      </div>

      <aside class="cart-summary">
        <h3>Summary</h3>
        <div class="summary-row">
          <span>Subtotal</span>
          <span>${formatPrice(state.subtotal, state.currency)}</span>
        </div>
        <div class="summary-row">
          <span>Shipping</span>
          <span class="muted">Calculated at checkout</span>
        </div>
        <div class="summary-row total">
          <span>Total</span>
          <span>${formatPrice(state.subtotal, state.currency)}</span>
        </div>
        <button class="btn btn-primary btn-block btn-lg" id="checkout-btn">
          Checkout
        </button>
        <p class="summary-note">
          ${
            session.isLoggedIn()
              ? 'Logged in — your cart is saved to your account.'
              : 'Guest checkout. <a href="/ui/pages/login/index.html" style="text-decoration:underline">Log in</a> to save your cart.'
          }
        </p>
      </aside>
    </div>
  `;

  wireCartItems();

  document.querySelector('#clear-cart')?.addEventListener('click', async () => {
    if (!confirm('Empty your cart?')) return;
    await cart.clear();
    toast('Cart cleared');
  });

  document.querySelector('#checkout-btn')?.addEventListener('click', () => {
    if (!session.isLoggedIn()) {
      toast('Please log in to checkout.', { type: 'info' });
      const next = encodeURIComponent('/ui/pages/cart/index.html');
      window.location.href = `/ui/pages/login/index.html?next=${next}`;
      return;
    }
    window.location.href = '/ui/pages/checkout/index.html';
  });
}

function renderItem(item) {
  return `
    <div class="cart-item" data-id="${item.productId}">
      <a href="/ui/pages/product/index.html?id=${item.productId}" class="cart-item-img">
        <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}">
      </a>
      <div class="cart-item-info">
        <h3><a href="/ui/pages/product/index.html?id=${item.productId}" style="color:inherit">${escapeHtml(item.name)}</a></h3>
        <div class="item-price">${formatPrice(item.price, item.currency)} each</div>
        <div class="item-controls">
          <div class="qty-stepper">
            <button data-step="-1" data-id="${item.productId}" aria-label="Decrease">−</button>
            <input class="qty-input" type="number" value="${item.quantity}" min="1"
                   data-id="${item.productId}">
            <button data-step="1" data-id="${item.productId}" aria-label="Increase">+</button>
          </div>
          <button class="item-remove" data-remove="${item.productId}">Remove</button>
        </div>
      </div>
      <div class="cart-item-subtotal">${formatPrice(item.subtotal, item.currency)}</div>
    </div>
  `;
}

function wireCartItems() {
  document.querySelectorAll('[data-step]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      const step = +btn.dataset.step;
      const current = cart.state.items.find((i) => i.productId === id);
      if (!current) return;
      const next = current.quantity + step;
      if (next < 1) {
        await cart.remove(id);
      } else {
        await cart.update(id, next);
      }
    });
  });

  document.querySelectorAll('.qty-input').forEach((input) => {
    input.addEventListener('change', async () => {
      const next = Math.max(0, parseInt(input.value, 10) || 0);
      const id = input.dataset.id;
      if (next === 0) await cart.remove(id);
      else await cart.update(id, next);
    });
  });

  document.querySelectorAll('[data-remove]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      await cart.remove(btn.dataset.remove);
      toast('Removed from cart');
    });
  });
}
