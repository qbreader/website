import account from '../scripts/accounts.js';

account.deleteUsername();

const form = document.getElementById('forgot-password-form');
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  event.stopPropagation();
  form.classList.add('was-validated');

  if (!form.checkValidity()) {
    return;
  }

  document.getElementById('submission').textContent = 'Submitting...';

  // either a username or a verified email
  const identifier = document.getElementById('username').value;
  await fetch('/auth/send-password-reset-email?' + new URLSearchParams({ username: identifier }));
  window.location.href = '/';
}, false);
