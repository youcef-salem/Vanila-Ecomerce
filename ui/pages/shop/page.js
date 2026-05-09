/**
 * Shop page
 * ---------------------------------------------------------------------------
 * Owns: product grid + filters (search, category, sort) on the home page.
 */

import { api } from '../../../logic/api/client.js';
import { cart } from '../../../logic/modules/cart.js';
import { bootstrap, formatPrice, toast, getQueryParam, onReady } from '../../../logic/modules/ui.js';

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

function cloneTemplate(id) {
  const template = document.querySelector(`#${id}`);
  return template ? template.content.cloneNode(true) : null;
}

function cloneTemplateElement(id) {
  const template = document.querySelector(`#${id}`);
  return template ? template.content.firstElementChild.cloneNode(true) : null;
}

async function renderCategories() {
  const root = document.querySelector('#cat-pills');
  if (!root) return;
  const { items } = await api.listCategories();
  const all = [{ id: 'all', label: 'Everything' }, ...items];
  root.replaceChildren();
  all.forEach((c) => {
    const btn = cloneTemplateElement('shop-category-pill-template');
    if (!btn) return;
    btn.dataset.cat = c.id;
    btn.textContent = c.label;
    btn.classList.toggle('is-active', filters.category === c.id);
    root.append(btn);
  });

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
  grid.replaceChildren();
  for (let i = 0; i < 8; i += 1) {
    const card = cloneTemplate('shop-skeleton-card-template');
    if (card) grid.append(card);
  }
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
    const empty = cloneTemplate('shop-empty-template');
    if (empty) grid.replaceChildren(empty);
    return;
  }
  grid.replaceChildren();
  items.forEach((item) => {
    const card = renderCard(item);
    if (card) grid.append(card);
  });

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
  const card = cloneTemplateElement('shop-product-card-template');
  if (!card) return null;

  card.href = `/ui/pages/product/index.html?id=${p.id}`;
  const img = card.querySelector('img');
  img.src = p.image;
  img.alt = p.name;

  card.querySelector('.product-category').textContent = p.category;
  card.querySelector('.product-card-name').textContent = p.name;
  card.querySelector('.product-card-price').textContent = formatPrice(p.price, p.currency);

  const stars = card.querySelector('[data-role="stars"]');
  const reviews = card.querySelector('[data-role="review-count"]');
  stars.textContent = renderStars(p.rating);
  reviews.textContent = p.reviews || 0;

  const stockTag = card.querySelector('[data-role="stock-tag"]');
  if (p.stock === 0) {
    stockTag.textContent = 'Sold out';
    stockTag.hidden = false;
  } else if (p.stock <= 5) {
    stockTag.textContent = `Only ${p.stock} left`;
    stockTag.hidden = false;
  } else {
    stockTag.hidden = true;
  }

  return card;
}

function renderStars(rating = 0) {
  const full = Math.round(rating);
  return '★★★★★'.slice(0, full) + '☆☆☆☆☆'.slice(0, 5 - full);
}
