/**
 * Checkout page
 */

import { api } from '../../../logic/api/client.js';
import { cart } from '../../../logic/modules/cart.js';
import { session } from '../../../logic/modules/session.js';
import { bootstrap, formatPrice, toast, onReady } from '../../../logic/modules/ui.js';

bootstrap();

onReady(async () => {
  await cart.refresh();
  renderCheckout();
});

function cloneTemplate(id) {
  const template = document.querySelector(`#${id}`);
  return template ? template.content.cloneNode(true) : null;
}

async function renderCheckout() {
  const root = document.querySelector('#checkout-root');
  if (!root) return;

  if (!cart.state.items.length) {
    const fragment = cloneTemplate('checkout-empty-template');
    if (fragment) root.replaceChildren(fragment);
    return;
  }

  if (!session.isLoggedIn()) {
    const fragment = cloneTemplate('checkout-login-template');
    if (fragment) root.replaceChildren(fragment);
    return;
  }

  const [{ items: wilayas }, { items: deliveryMethods }] = await Promise.all([
    api.listDeliveryWilayas(),
    api.listDeliveryMethods(),
  ]);

  const formFragment = cloneTemplate('checkout-form-template');
  if (formFragment) root.replaceChildren(formFragment);

  const subtotal = cart.state.subtotal;
  const currency = cart.state.currency;
  const subtotalNode = root.querySelector('#subtotal');
  const deliveryNode = root.querySelector('#delivery');
  const totalNode = root.querySelector('#total');

  if (subtotalNode) subtotalNode.textContent = formatPrice(subtotal, currency);
  if (deliveryNode) deliveryNode.textContent = formatPrice(0, currency);
  if (totalNode) totalNode.textContent = formatPrice(subtotal, currency);

  const wilayaSelect = root.querySelector('#wilaya');
  const wilayaTemplate = document.querySelector('#checkout-wilaya-option-template');
  if (wilayaSelect && wilayaTemplate) {
    wilayas.forEach((w) => {
      const option = wilayaTemplate.content.firstElementChild.cloneNode(true);
      option.value = w.id;
      option.dataset.price = w.price;
      option.textContent = w.name || w.id;
      wilayaSelect.append(option);
    });
  }

  const methodWrap = root.querySelector('#delivery-methods');
  const methodTemplate = document.querySelector('#checkout-delivery-method-template');
  if (methodWrap && methodTemplate) {
    deliveryMethods.forEach((m, i) => {
      const item = methodTemplate.content.firstElementChild.cloneNode(true);
      const input = item.querySelector('input');
      const label = item.querySelector('span');
      input.value = m.id;
      input.dataset.extra = m.extra;
      input.checked = i === 0;
      label.textContent = m.label;
      methodWrap.append(item);
    });
  }

  const form = document.querySelector('#checkout-form');
  const errBox = document.querySelector('#form-error');
  const methodInputs = Array.from(root.querySelectorAll('input[name="deliveryMethod"]'));

  const refreshSummary = () => {
    updateSummary(getDeliveryPrice(wilayaSelect, methodInputs));
  };

  wilayaSelect.addEventListener('change', refreshSummary);
  methodInputs.forEach((input) => input.addEventListener('change', refreshSummary));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errBox.hidden = true;

    const wilayaId = form.wilaya.value;
    const address = form.address.value.trim();

    if (!wilayaId) {
      errBox.textContent = 'Please select a delivery wilaya.';
      errBox.hidden = false;
      return;
    }
    if (!address) {
      errBox.textContent = 'Please enter your exact address.';
      errBox.hidden = false;
      return;
    }

    const deliveryPrice = getDeliveryPrice(wilayaSelect, methodInputs);
    updateSummary(deliveryPrice);

    await cart.clear();
    toast('Order placed. We will contact you soon.', { type: 'success' });

    const successFragment = cloneTemplate('checkout-success-template');
    if (successFragment) root.replaceChildren(successFragment);
  });
}

function updateSummary(deliveryPrice) {
  const subtotal = cart.state.subtotal;
  const total = subtotal + deliveryPrice;
  const currency = cart.state.currency;

  document.querySelector('#delivery').textContent = formatPrice(deliveryPrice, currency);
  document.querySelector('#total').textContent = formatPrice(total, currency);
}

function getDeliveryPrice(wilayaSelect, methodInputs) {
  const base = +wilayaSelect.selectedOptions[0]?.dataset.price || 0;
  const method = methodInputs.find((input) => input.checked);
  const extra = method ? +method.dataset.extra || 0 : 0;
  return base + extra;
}
