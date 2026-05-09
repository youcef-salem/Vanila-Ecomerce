/**
 * Cart page
 */

import { cart } from '../../../logic/modules/cart.js';
import { session } from '../../../logic/modules/session.js';
import { bootstrap, formatPrice, toast, onReady } from '../../../logic/modules/ui.js';

bootstrap('cart');

onReady(async () => {
  // The bootstrap() call already triggers cart.refresh(), but cart.on('change')
  // ensures we re-render whenever the bootstrap refresh resolves OR when an
  // item changes from any other interaction.
  cart.on('change', renderPage);
  renderPage(cart.state);
});

function cloneTemplate(id) {
  const template = document.querySelector(`#${id}`);
  return template ? template.content.cloneNode(true) : null;
}

function renderPage(state) {
  const root = document.querySelector('#cart-root');
  if (!root) return;

  if (state.loading && !state.items.length) {
    const fragment = cloneTemplate('cart-loading-template');
    if (fragment) root.replaceChildren(fragment);
    return;
  }

  if (!state.items.length) {
    const fragment = cloneTemplate('cart-empty-template');
    if (fragment) root.replaceChildren(fragment);
    return;
  }

  const layout = cloneTemplate('cart-layout-template');
  if (layout) root.replaceChildren(layout);

  const count = root.querySelector('#cart-item-count');
  if (count) {
    count.textContent = `${state.itemCount} ${state.itemCount === 1 ? 'item' : 'items'}`;
  }

  const subtotalNode = root.querySelector('#summary-subtotal');
  const totalNode = root.querySelector('#summary-total');
  if (subtotalNode) subtotalNode.textContent = formatPrice(state.subtotal, state.currency);
  if (totalNode) totalNode.textContent = formatPrice(state.subtotal, state.currency);

  const note = root.querySelector('#summary-note');
  if (note) {
    const noteTemplate = session.isLoggedIn()
      ? cloneTemplate('cart-summary-logged-in-template')
      : cloneTemplate('cart-summary-guest-template');
    if (noteTemplate) note.replaceChildren(noteTemplate);
  }

  const itemsWrap = root.querySelector('#cart-items');
  if (itemsWrap) {
    itemsWrap.replaceChildren();
    state.items.forEach((item) => {
      const frag = cloneTemplate('cart-item-template');
      if (!frag) return;
      const row = frag.firstElementChild;
      row.dataset.id = item.productId;

      const link = row.querySelector('.cart-item-img');
      const titleLink = row.querySelector('.cart-item-link');
      const img = row.querySelector('img');
      const price = row.querySelector('[data-role="item-price"]');
      const subtotal = row.querySelector('[data-role="item-subtotal"]');
      const qtyInput = row.querySelector('.qty-input');
      const removeBtn = row.querySelector('.item-remove');
      const stepBtns = row.querySelectorAll('[data-step]');

      const href = `/ui/pages/product/index.html?id=${item.productId}`;
      link.href = href;
      titleLink.href = href;
      titleLink.textContent = item.name;
      img.src = item.image;
      img.alt = item.name;
      price.textContent = `${formatPrice(item.price, item.currency)} each`;
      subtotal.textContent = formatPrice(item.subtotal, item.currency);

      qtyInput.value = item.quantity;
      qtyInput.dataset.id = item.productId;
      removeBtn.dataset.remove = item.productId;
      stepBtns.forEach((btn) => {
        btn.dataset.id = item.productId;
      });

      itemsWrap.append(frag);
    });
  }

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
