/**
 * Admin dashboard page
 * - lists all products
 * - allows creating, updating, deleting items
 * - gates the whole page behind an admin-role check
 */

import { api } from '../../../logic/api/client.js';
import { session } from '../../../logic/modules/session.js';
import { bootstrap, formatPrice, toast, onReady } from '../../../logic/modules/ui.js';

bootstrap('admin');

let products = [];
let editingId = null; // null when creating, productId when editing

onReady(async () => {
  // Wait for the session refresh that bootstrap kicks off so we know
  // whether the user is admin before rendering.
  await session.refresh();

  if (!session.isAdmin()) {
    const root = document.querySelector('#admin-root');
    const fragment = cloneTemplate('admin-not-authorized-template');
    if (root && fragment) root.replaceChildren(fragment);
    return;
  }

  await loadProducts();
  setupForm();
});

function cloneTemplate(id) {
  const template = document.querySelector(`#${id}`);
  return template ? template.content.cloneNode(true) : null;
}

function cloneTemplateElement(id) {
  const template = document.querySelector(`#${id}`);
  return template ? template.content.firstElementChild.cloneNode(true) : null;
}

async function loadProducts() {
  const { items } = await api.listProducts({ sort: 'newest' });
  products = items;
  renderTable();
}

function renderTable() {
  const root = document.querySelector('#admin-table-wrap');
  if (!root) return;
  const tableFragment = cloneTemplate('admin-table-template');
  if (!tableFragment) return;
  root.replaceChildren(tableFragment);

  const tbody = root.querySelector('tbody');
  if (!tbody) return;

  products.forEach((p) => {
    const row = cloneTemplateElement('admin-table-row-template');
    if (!row) return;

    row.dataset.id = p.id;
    const img = row.querySelector('.thumb');
    const nameCell = row.querySelector('.name-cell');
    const categoryCell = row.querySelector('.category-cell');
    const priceCell = row.querySelector('.price-cell');
    const stockCell = row.querySelector('.stock-cell');
    const editBtn = row.querySelector('[data-edit]');
    const deleteBtn = row.querySelector('[data-delete]');

    img.src = p.image;
    nameCell.textContent = p.name;
    categoryCell.textContent = p.category;
    priceCell.textContent = formatPrice(p.price, p.currency);
    stockCell.textContent = p.stock;
    stockCell.classList.toggle('low', p.stock < 5);
    editBtn.dataset.edit = p.id;
    deleteBtn.dataset.delete = p.id;

    tbody.append(row);
  });

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
