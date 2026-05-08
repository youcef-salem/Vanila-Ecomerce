/**
 * Product detail page
 */

import { api } from '../../../js/api/client.js';
import { cart } from '../../../js/modules/cart.js';
import { bootstrap, formatPrice, escapeHtml, toast, getQueryParam, onReady } from '../../../js/modules/ui.js';

bootstrap('shop');

let activeImageIndex = 0;
let product = null;

onReady(async () => {
  const id = getQueryParam('id');
  const root = document.querySelector('#product-root');
  if (!id) {
    root.innerHTML = '<p class="muted" style="padding: 4rem 1rem; text-align: center;">No product selected.</p>';
    return;
  }
  try {
    product = await api.getProduct(id);
    render(product);
  } catch (err) {
    root.innerHTML = `
      <div class="empty-state">
        <h3>Product not found.</h3>
        <p>We couldn't find that piece. <a href="/ui/pages/shop/index.html">Browse the shop</a>.</p>
      </div>
    `;
  }
});

function render(p) {
  const root = document.querySelector('#product-root');
  const images = (p.images && p.images.length ? p.images : [p.image]).filter(Boolean);
  activeImageIndex = 0;

  root.innerHTML = `
    <a class="back-link" href="/ui/pages/shop/index.html">← Back to shop</a>
    <div class="product-detail">
      <div class="product-gallery">
        <div class="product-gallery-main">
          <img id="gallery-main" src="${escapeHtml(images[0])}" alt="${escapeHtml(p.name)}">
        </div>
        ${
          images.length > 1
            ? `
          <div class="product-gallery-thumbs" id="gallery-thumbs">
            ${images
              .map(
                (src, i) => `
              <button class="${i === 0 ? 'is-active' : ''}" data-i="${i}">
                <img src="${escapeHtml(src)}" alt="">
              </button>
            `,
              )
              .join('')}
          </div>
        `
            : ''
        }
      </div>

      <div class="product-info">
        <span class="eyebrow">${escapeHtml(p.category)}</span>
        <h1>${escapeHtml(p.name)}</h1>
        <div class="product-info-rating">
          <span class="stars">${renderStars(p.rating)}</span>
          <span>${(p.rating || 0).toFixed(1)} · ${p.reviews || 0} reviews</span>
        </div>
        <div class="product-info-price">${formatPrice(p.price, p.currency)}</div>

        <div class="product-info-desc">
          ${escapeHtml(p.longDescription || p.description)}
        </div>

        <div class="product-info-actions">
          <div class="qty-stepper">
            <button type="button" data-step="-1" aria-label="Decrease quantity">−</button>
            <input type="number" id="qty-input" value="1" min="1" max="${p.stock}">
            <button type="button" data-step="1" aria-label="Increase quantity">+</button>
          </div>
          <button class="btn btn-primary btn-lg" id="add-to-cart"
                  ${p.stock === 0 ? 'disabled' : ''}>
            ${p.stock === 0 ? 'Sold out' : 'Add to cart'}
          </button>
        </div>

        <div class="product-info-meta">
          <dl>
            <dt>Stock</dt>
            <dd>${p.stock > 0 ? `${p.stock} available` : 'Out of stock'}</dd>
            <dt>Category</dt>
            <dd>${escapeHtml(p.category)}</dd>
            <dt>Item ref.</dt>
            <dd><code>${escapeHtml(p.id)}</code></dd>
          </dl>
          ${
            (p.tags || []).length
              ? `<div class="product-tags">
              ${p.tags.map((t) => `<span class="product-tag">${escapeHtml(t)}</span>`).join('')}
            </div>`
              : ''
          }
        </div>
      </div>
    </div>
  `;

  document.title = `${p.name} — Atelier`;

  // Gallery thumbnails
  const thumbs = document.querySelector('#gallery-thumbs');
  thumbs?.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    activeImageIndex = +btn.dataset.i;
    document.querySelector('#gallery-main').src = images[activeImageIndex];
    thumbs.querySelectorAll('button').forEach((b) =>
      b.classList.toggle('is-active', +b.dataset.i === activeImageIndex),
    );
  });

  // Quantity stepper
  const qtyInput = document.querySelector('#qty-input');
  document.querySelectorAll('[data-step]').forEach((btn) =>
    btn.addEventListener('click', () => {
      const step = +btn.dataset.step;
      const next = Math.max(1, Math.min(p.stock, +qtyInput.value + step));
      qtyInput.value = next;
    }),
  );
  qtyInput.addEventListener('change', () => {
    qtyInput.value = Math.max(1, Math.min(p.stock, +qtyInput.value || 1));
  });

  // Add to cart
  document.querySelector('#add-to-cart').addEventListener('click', async () => {
    const btn = document.querySelector('#add-to-cart');
    btn.disabled = true;
    try {
      await cart.add(p.id, +qtyInput.value);
      toast(`Added ${qtyInput.value} × ${p.name} to cart`, { type: 'success' });
    } catch (err) {
      toast(err.message || 'Could not add to cart', { type: 'error' });
    } finally {
      btn.disabled = p.stock === 0;
    }
  });
}

function renderStars(rating = 0) {
  const full = Math.round(rating);
  return '★★★★★'.slice(0, full) + '☆☆☆☆☆'.slice(0, 5 - full);
}
