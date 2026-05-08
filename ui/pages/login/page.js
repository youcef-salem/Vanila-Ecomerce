/**
 * Login page
 */

import { session } from '../../../js/modules/session.js';
import { cart } from '../../../js/modules/cart.js';
import { bootstrap, toast, getQueryParam, onReady } from '../../../js/modules/ui.js';

bootstrap();

onReady(() => {
  const form = document.querySelector('#login-form');
  const errBox = document.querySelector('#form-error');

  // If already logged in, send them home.
  session.on('change', () => {
    if (session.isLoggedIn()) redirectAfterLogin();
  });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    errBox.hidden = true;
    const submit = form.querySelector('[type="submit"]');
    submit.disabled = true;
    submit.textContent = 'Signing in…';

    const email = form.email.value.trim();
    const password = form.password.value;

    try {
      await session.login({ email, password });
      // Re-fetch the cart now that we're logged in
      // (in a real app the server would merge the guest cart for us).
      await cart.refresh();
      toast(`Welcome back, ${session.user.name}`, { type: 'success' });
      redirectAfterLogin();
    } catch (err) {
      errBox.hidden = false;
      errBox.textContent = err.message || 'Login failed.';
    } finally {
      submit.disabled = false;
      submit.textContent = 'Sign in';
    }
  });
});

function redirectAfterLogin() {
  const next = getQueryParam('next') || '/ui/pages/shop/index.html';
  // Avoid open-redirects: only allow same-origin paths.
  const safe = /^[a-zA-Z0-9_\-./?=&%]+$/.test(next) ? next : '/ui/pages/shop/index.html';
  window.location.href = safe;
}
