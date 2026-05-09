/**
 * Product detail page
 */

import { api } from '../../../logic/api/client.js';
import { cart } from '../../../logic/modules/cart.js';
import { bootstrap, formatPrice, toast, getQueryParam, onReady } from '../../../logic/modules/ui.js';

bootstrap('shop');

let activeImageIndex = 0;
let product = null;

onReady(async () => {
  const id = getQueryParam('id');
  const root = document.querySelector('#product-root');
  if (!id) {
    const fragment = cloneTemplate('product-empty-template');
    if (root && fragment) root.replaceChildren(fragment);
    return;
  }
  try {
    product = await api.getProduct(id);
    render(product);
  } catch (err) {
    const fragment = cloneTemplate('product-not-found-template');
    if (root && fragment) root.replaceChildren(fragment);
  }
});

function cloneTemplate(id) {
  const template = document.querySelector(`#${id}`);
  return template ? template.content.cloneNode(true) : null;
}

function cloneTemplateElement(id) {
  const template = document.querySelector(`#${id}`);
  return template ? template.content.firstElementChild.cloneNode(true) : null;
}

function render(p) {
  const root = document.querySelector('#product-root');
  const images = (p.images && p.images.length ? p.images : [p.image]).filter(Boolean);
  activeImageIndex = 0;

  const layout = cloneTemplate('product-layout-template');
  if (!root || !layout) return;
  root.replaceChildren(layout);

  const mainImg = root.querySelector('#gallery-main');
  mainImg.src = images[0];
  mainImg.alt = p.name;

  const thumbs = root.querySelector('#gallery-thumbs');
  if (images.length > 1 && thumbs) {
    images.forEach((src, i) => {
      const btn = cloneTemplateElement('product-thumb-template');
      if (!btn) return;
      const img = btn.querySelector('img');
      img.src = src;
      img.alt = '';
      btn.dataset.i = i;
      btn.classList.toggle('is-active', i === 0);
      thumbs.append(btn);
    });
  } else if (thumbs) {
    thumbs.hidden = true;
  }

  root.querySelector('#product-category').textContent = p.category;
  root.querySelector('#product-name').textContent = p.name;
  root.querySelector('#product-stars').textContent = renderStars(p.rating);
  root.querySelector('#product-reviews').textContent = `${(p.rating || 0).toFixed(1)} · ${p.reviews || 0} reviews`;
  root.querySelector('#product-price').textContent = formatPrice(p.price, p.currency);
  root.querySelector('#product-description').textContent = p.longDescription || p.description || '';

  const qtyInput = root.querySelector('#qty-input');
  qtyInput.max = p.stock;
  qtyInput.value = 1;

  const addToCartBtn = root.querySelector('#add-to-cart');
  addToCartBtn.disabled = p.stock === 0;
  addToCartBtn.textContent = p.stock === 0 ? 'Sold out' : 'Add to cart';

  root.querySelector('#product-stock').textContent = p.stock > 0 ? `${p.stock} available` : 'Out of stock';
  root.querySelector('#product-category-meta').textContent = p.category;
  root.querySelector('#product-id').textContent = p.id;

  const tagsWrap = root.querySelector('#product-tags');
  if ((p.tags || []).length) {
    p.tags.forEach((tag) => {
      const tagEl = cloneTemplateElement('product-tag-template');
      if (!tagEl) return;
      tagEl.textContent = tag;
      tagsWrap.append(tagEl);
    });
  } else if (tagsWrap) {
    tagsWrap.hidden = true;
  }

  document.title = `${p.name} — Atelier`;

  // Gallery thumbnails
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
