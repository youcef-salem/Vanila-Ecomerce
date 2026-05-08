/**
 * Shop page
 * ---------------------------------------------------------------------------
 * Owns: product grid + filters (search, category, sort) on the home page.
 */

import { api } from '../../../logic/api/client.js';
import { cart } from '../../../logic/modules/cart.js';
import { bootstrap, formatPrice, escapeHtml, toast, getQueryParam, onReady } from '../../../logic/modules/ui.js';

bootstrap('shop');

const filters = {
  search: '',
  category: getQueryParam('cat') || 'all',
  sort: 'newest',
};

let searchDebounce = null;

onReady(async () => {
  await renderCategories();
  setupFilterEvents();
  await loadProducts();
});

async function renderCategories() {
  const root = document.querySelector('#cat-pills');
  if (!root) return;
  const { items } = await api.listCategories();
  const all = [{ id: 'all', label: 'Everything' }, ...items];
  root.innerHTML = all
    .map(
      (c) => `
        <button class="cat-pill ${filters.category === c.id ? 'is-active' : ''}"
                data-cat="${c.id}">
          ${escapeHtml(c.label)}
        </button>
      `,
    )
    .join('');

  root.addEventListener('click', (e) => {
    const btn = e.target.closest('.cat-pill');
    if (!btn) return;
    filters.category = btn.dataset.cat;
    root.querySelectorAll('.cat-pill').forEach((p) => p.classList.toggle('is-active', p === btn));
    loadProducts();
  });
}

function setupFilterEvents() {
  const searchInput = document.querySelector('#search-input');
  const sortSelect = document.querySelector('#sort-select');

  searchInput?.addEventListener('input', (e) => {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => {
      filters.search = e.target.value.trim();
      loadProducts();
    }, 220);
  });

  sortSelect?.addEventListener('change', (e) => {
    filters.sort = e.target.value;
    loadProducts();
  });
}

function showSkeletons() {
  const grid = document.querySelector('#product-grid');
  if (!grid) return;
  grid.innerHTML = Array.from({ length: 8 })
    .map(
      () => `
      <div class="skeleton-card" aria-hidden="true">
        <div class="skeleton-block image"></div>
        <div class="skeleton-block line w-60"></div>
        <div class="skeleton-block line"></div>
      </div>
    `,
    )
    .join('');
}

async function loadProducts() {
  showSkeletons();
  try {
    const { items, total } = await api.listProducts(filters);
    renderProducts(items);
    const counter = document.querySelector('#result-count');
    if (counter) {
      counter.textContent = `${total} ${total === 1 ? 'piece' : 'pieces'}`;
    }
  } catch (err) {
    toast('Could not load products. ' + (err.message || ''), { type: 'error' });
  }
}

function renderProducts(items) {
  const grid = document.querySelector('#product-grid');
  if (!grid) return;
  if (!items.length) {
    grid.innerHTML = `
      <div class="empty-state">
        <h3>Nothing matches that.</h3>
        <p class="muted">Try a different search or clear the filters.</p>
      </div>
    `;
    return;
  }
  grid.innerHTML = items.map(renderCard).join('');

  // Wire up "add to cart" buttons.
  grid.querySelectorAll('[data-add]').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const id = btn.dataset.add;
      btn.disabled = true;
      try {
        await cart.add(id, 1);
        toast('Added to cart', { type: 'success' });
      } catch (err) {
        toast(err.message || 'Could not add to cart', { type: 'error' });
      } finally {
        btn.disabled = false;
      }
    });
  });
}

function renderCard(p) {
  const stockTag =
    p.stock <= 5 && p.stock > 0
      ? `<span class="stock-tag low">Only ${p.stock} left</span>`
      : p.stock === 0
        ? `<span class="stock-tag low">Sold out</span>`
        : '';
  return `
    <a class="product-card" href="/ui/pages/product/index.html?id=${p.id}">
      <div class="product-card-image">
        ${stockTag}
        <img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" loading="lazy">
      </div>
      <div class="product-card-meta">
        <span>${escapeHtml(p.category)}</span>
        <span class="product-card-rating">
          <span class="stars">${renderStars(p.rating)}</span>
          <span>${p.reviews || 0}</span>
        </span>
      </div>
      <h3 class="product-card-name">${escapeHtml(p.name)}</h3>
      <div class="product-card-price">${formatPrice(p.price, p.currency)}</div>
    </a>
  `;
}

function renderStars(rating = 0) {
  const full = Math.round(rating);
  return '★★★★★'.slice(0, full) + '☆☆☆☆☆'.slice(0, 5 - full);
}
