/**
 * Admin dashboard page
 * - lists all products
 * - allows creating, updating, deleting items
 * - gates the whole page behind an admin-role check
 */

import { api } from '../api/client.js';
import { session } from '../modules/session.js';
import { bootstrap, formatPrice, escapeHtml, toast, onReady } from '../modules/ui.js';

bootstrap('admin');

let products = [];
let editingId = null; // null when creating, productId when editing

onReady(async () => {
  // Wait for the session refresh that bootstrap kicks off so we know
  // whether the user is admin before rendering.
  await session.refresh();

  if (!session.isAdmin()) {
    document.querySelector('#admin-root').innerHTML = `
      <div class="admin-not-authorized">
        <span class="eyebrow">Restricted</span>
        <h2 style="font-family: var(--font-display); font-style: italic; margin: 0.5rem 0 1rem;">
          Admin access only.
        </h2>
        <p class="muted" style="margin-bottom: 1.5rem">
          You need to sign in with an admin account to manage the catalog.
        </p>
        <a class="btn btn-primary" href="admin.html">Go to admin login</a>
      </div>
    `;
    return;
  }

  await loadProducts();
  setupForm();
});

async function loadProducts() {
  const { items } = await api.listProducts({ sort: 'newest' });
  products = items;
  renderTable();
}

function renderTable() {
  const root = document.querySelector('#admin-table-wrap');
  if (!root) return;
  root.innerHTML = `
    <table class="admin-table">
      <thead>
        <tr>
          <th></th>
          <th>Name</th>
          <th>Category</th>
          <th>Price</th>
          <th>Stock</th>
          <th class="actions">Actions</th>
        </tr>
      </thead>
      <tbody>
        ${products
          .map(
            (p) => `
          <tr data-id="${p.id}">
            <td><img class="thumb" src="${escapeHtml(p.image)}" alt=""></td>
            <td class="name-cell">${escapeHtml(p.name)}</td>
            <td>${escapeHtml(p.category)}</td>
            <td class="price-cell">${formatPrice(p.price, p.currency)}</td>
            <td class="stock-cell ${p.stock < 5 ? 'low' : ''}">${p.stock}</td>
            <td class="actions">
              <button class="btn btn-ghost btn-sm" data-edit="${p.id}">Edit</button>
              <button class="btn btn-danger btn-sm" data-delete="${p.id}">Delete</button>
            </td>
          </tr>
        `,
          )
          .join('')}
      </tbody>
    </table>
  `;

  root.querySelectorAll('[data-edit]').forEach((btn) => {
    btn.addEventListener('click', () => startEdit(btn.dataset.edit));
  });
  root.querySelectorAll('[data-delete]').forEach((btn) => {
    btn.addEventListener('click', () => deleteItem(btn.dataset.delete));
  });
}

function setupForm() {
  const form = document.querySelector('#product-form');
  const cancelBtn = document.querySelector('#cancel-edit');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submit = form.querySelector('[type="submit"]');
    submit.disabled = true;

    const payload = {
      name: form.name.value.trim(),
      category: form.category.value.trim().toLowerCase(),
      price: parseFloat(form.price.value),
      stock: parseInt(form.stock.value, 10),
      image: form.image.value.trim(),
      description: form.description.value.trim(),
      longDescription: form.description.value.trim(),
      tags: form.tags.value
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    };

    try {
      if (editingId) {
        await api.updateProduct(editingId, payload);
        toast('Product updated', { type: 'success' });
      } else {
        await api.createProduct(payload);
        toast('Product added', { type: 'success' });
      }
      resetForm();
      await loadProducts();
    } catch (err) {
      toast(err.message || 'Could not save product', { type: 'error' });
    } finally {
      submit.disabled = false;
    }
  });

  cancelBtn.addEventListener('click', resetForm);
}

function startEdit(id) {
  const product = products.find((p) => p.id === id);
  if (!product) return;
  editingId = id;

  const form = document.querySelector('#product-form');
  form.name.value = product.name;
  form.category.value = product.category;
  form.price.value = product.price;
  form.stock.value = product.stock;
  form.image.value = product.image || '';
  form.description.value = product.longDescription || product.description || '';
  form.tags.value = (product.tags || []).join(', ');

  document.querySelector('#form-title').textContent = 'Edit product';
  document.querySelector('#form-submit').textContent = 'Save changes';
  document.querySelector('#cancel-edit').hidden = false;

  document.querySelector('#product-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function resetForm() {
  editingId = null;
  document.querySelector('#product-form').reset();
  document.querySelector('#form-title').textContent = 'Add a new product';
  document.querySelector('#form-submit').textContent = 'Add product';
  document.querySelector('#cancel-edit').hidden = true;
}

async function deleteItem(id) {
  const product = products.find((p) => p.id === id);
  if (!product) return;
  if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
  try {
    await api.deleteProduct(id);
    toast('Product deleted');
    await loadProducts();
  } catch (err) {
    toast(err.message || 'Could not delete', { type: 'error' });
  }
}
