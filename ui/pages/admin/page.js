/**
 * Admin login page
 */

import { session } from '../../../logic/modules/session.js';
import { cart } from '../../../logic/modules/cart.js';
import { bootstrap, toast, onReady } from '../../../logic/modules/ui.js';

bootstrap();

onReady(() => {
  const form = document.querySelector('#admin-login-form');
  const errBox = document.querySelector('#form-error');

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    errBox.hidden = true;
    const submit = form.querySelector('[type="submit"]');
    submit.disabled = true;
    submit.textContent = 'Signing in…';

    try {
      await session.adminLogin({
        email: form.email.value.trim(),
        password: form.password.value,
      });
      await cart.refresh();
      toast(`Welcome, ${session.user.name}`, { type: 'success' });
      window.location.href = '/ui/pages/admin-dashboard/index.html';
    } catch (err) {
      errBox.hidden = false;
      errBox.textContent = err.message || 'Admin login failed.';
    } finally {
      submit.disabled = false;
      submit.textContent = 'Enter admin';
    }
  });
});
