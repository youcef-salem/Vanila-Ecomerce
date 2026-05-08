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

async function renderCheckout() {
  const root = document.querySelector('#checkout-root');
  if (!root) return;

  if (!cart.state.items.length) {
    root.innerHTML = `
      <div class="checkout-empty">
        <h2>Your cart is empty.</h2>
        <p class="muted">Add items before checking out.</p>
        <a class="btn btn-primary" href="/ui/pages/shop/index.html">Browse shop</a>
      </div>
    `;
    return;
  }

  if (!session.isLoggedIn()) {
    root.innerHTML = `
      <div class="checkout-empty">
        <h2>Please log in to checkout.</h2>
        <p class="muted">Your cart is saved once you sign in.</p>
        <a class="btn btn-primary" href="/ui/pages/login/index.html?next=/ui/pages/checkout/index.html">Log in</a>
      </div>
    `;
    return;
  }

  const [{ items: wilayas }, { items: deliveryMethods }] = await Promise.all([
    api.listDeliveryWilayas(),
    api.listDeliveryMethods(),
  ]);

  root.innerHTML = `
    <div class="checkout-header">
      <span class="eyebrow">Checkout</span>
      <h1>Delivery & payment</h1>
      <p class="muted" style="margin-top:0.5rem">
        Review your order and confirm delivery details.
      </p>
    </div>

    <div class="checkout-grid">
      <div class="checkout-card">
        <form id="checkout-form" novalidate>
          <div id="form-error" class="form-error" hidden></div>

          <div class="field">
            <label for="wilaya">Delivery wilaya</label>
            <select id="wilaya" name="wilaya" required>
              <option value="" selected>Select wilaya</option>
              ${wilayas
                .map((w) => `<option value="${w.id}" data-price="${w.price}">${w.name || w.id}</option>`)
                .join('')}
            </select>
          </div>

          <div class="field">
            <label>Delivery method</label>
            <div class="segmented" role="radiogroup">
              ${deliveryMethods
                .map(
                  (m, i) => `
                <label class="segmented-item">
                  <input type="radio" name="deliveryMethod" value="${m.id}" data-extra="${m.extra}" ${i === 0 ? 'checked' : ''}>
                  <span>${m.label}</span>
                </label>
              `,
                )
                .join('')}
            </div>
          </div>

          <div class="field">
            <label for="address">Exact address</label>
            <textarea id="address" name="address" rows="4" required placeholder="Street, building, city"></textarea>
          </div>

          <div class="field">
            <label>Payment method</label>
            <div class="segmented" role="radiogroup">
              <label class="segmented-item">
                <input type="radio" name="payment" value="dahabiya" checked>
                <span>Dahabiya</span>
              </label>
              <label class="segmented-item">
                <input type="radio" name="payment" value="cod">
                <span>Cash on delivery</span>
              </label>
            </div>
          </div>

          <button type="submit" class="btn btn-primary btn-block btn-lg">Place order</button>
        </form>
      </div>

      <aside class="checkout-card" id="summary-card">
        <div class="summary-title">Order summary</div>
        <div class="summary-row">
          <span>Subtotal</span>
          <span id="subtotal">${formatPrice(cart.state.subtotal, cart.state.currency)}</span>
        </div>
        <div class="summary-row">
          <span>Delivery</span>
          <span id="delivery">${formatPrice(0, cart.state.currency)}</span>
        </div>
        <div class="summary-row total">
          <span>Total</span>
          <span id="total">${formatPrice(cart.state.subtotal, cart.state.currency)}</span>
        </div>
        <p class="summary-note">Delivery price updates after choosing a wilaya.</p>
      </aside>
    </div>
  `;

  const form = document.querySelector('#checkout-form');
  const errBox = document.querySelector('#form-error');
  const wilayaSelect = document.querySelector('#wilaya');
  const methodInputs = Array.from(document.querySelectorAll('input[name="deliveryMethod"]'));

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

    root.innerHTML = `
      <div class="checkout-success">
        <h2>Thank you!</h2>
        <p class="muted">Your order has been received.</p>
        <a class="btn btn-primary" href="/ui/pages/shop/index.html">Back to shop</a>
      </div>
    `;
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
