/**
 * Register page
 */

import { session } from '../../../js/modules/session.js';
import { cart } from '../../../js/modules/cart.js';
import { bootstrap, toast, onReady } from '../../../js/modules/ui.js';

bootstrap();

onReady(() => {
  const form = document.querySelector('#register-form');
  const errBox = document.querySelector('#form-error');

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    errBox.hidden = true;
    const submit = form.querySelector('[type="submit"]');
    submit.disabled = true;
    submit.textContent = 'Creating…';

    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const password = form.password.value;
    const confirm = form.confirm.value;

    if (password !== confirm) {
      errBox.hidden = false;
      errBox.textContent = 'Passwords do not match.';
      submit.disabled = false;
      submit.textContent = 'Create account';
      return;
    }
    if (password.length < 6) {
      errBox.hidden = false;
      errBox.textContent = 'Password must be at least 6 characters.';
      submit.disabled = false;
      submit.textContent = 'Create account';
      return;
    }

    try {
      await session.register({ name, email, password });
      await cart.refresh();
      toast(`Welcome, ${session.user.name}`, { type: 'success' });
      window.location.href = '/ui/pages/shop/index.html';
    } catch (err) {
      errBox.hidden = false;
      errBox.textContent = err.message || 'Registration failed.';
      submit.disabled = false;
      submit.textContent = 'Create account';
    }
  });
});
