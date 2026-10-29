import account from '../scripts/accounts.js';

account.deleteUsername();

const passwordInput = document.getElementById('password');
const togglePassword = document.getElementById('toggle-password');
togglePassword.addEventListener('click', () => {
  const isPassword = passwordInput.type === 'password';
  passwordInput.type = isPassword ? 'text' : 'password';
  togglePassword.querySelector('i').classList.toggle('bi-eye', !isPassword);
  togglePassword.querySelector('i').classList.toggle('bi-eye-slash', isPassword);
  togglePassword.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
});

const form = document.getElementById('login-form');
form.addEventListener('submit', (event) => {
  event.preventDefault();
  event.stopPropagation();
  form.classList.add('was-validated');

  if (!form.checkValidity()) {
    return;
  }

  document.getElementById('submission').textContent = 'Logging in...';

  // either a username or a verified email
  const identifier = document.getElementById('username').value;
  fetch('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: identifier,
      password: document.getElementById('password').value
    })
  }).then(async function (response) {
    if (response.status === 200) {
      // use the username from the server, since the identifier may have been an email
      const { expires, username } = await response.json();
      account.setUsername(username, expires);
      if (window.location.search.length > 1) {
        window.location.href = decodeURIComponent(window.location.search.slice(1));
      } else {
        window.location.href = '/user/';
      }
    } else {
      document.getElementById('submission').textContent = 'Login';
      document.getElementById('password').value = '';
      window.alert('Invalid username, email, or password.');
    }
  });
}, false);
