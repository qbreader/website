const passwordInput = document.getElementById('password');
const togglePassword = document.getElementById('toggle-password');
togglePassword.addEventListener('click', () => {
  const isPassword = passwordInput.type === 'password';
  passwordInput.type = isPassword ? 'text' : 'password';
  togglePassword.querySelector('i').classList.toggle('bi-eye', !isPassword);
  togglePassword.querySelector('i').classList.toggle('bi-eye-slash', isPassword);
  togglePassword.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
});

const form = document.getElementById('signup-form');
form.addEventListener('submit', (event) => {
  event.preventDefault();
  event.stopPropagation();
  form.classList.add('was-validated');

  if (!form.checkValidity()) {
    return;
  }

  document.getElementById('submission').textContent = 'Submitting...';

  const username = document.getElementById('username').value;
  fetch('/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: document.getElementById('email').value,
      password: document.getElementById('password').value,
      username
    })
  }).then(async function (response) {
    if (response.status === 200) {
      const { expires } = await response.json();
      window.sessionStorage.setItem('account-username', JSON.stringify({ username, expires }));
      window.location.href = '/user/';
    } else if (response.status === 400) {
      document.getElementById('submission').textContent = 'Submit';
      document.getElementById('password').value = '';
      window.alert('Username is invalid.');
    } else if (response.status === 409) {
      document.getElementById('submission').textContent = 'Submit';
      document.getElementById('password').value = '';
      window.alert('Username already exists.');
    }
  });
}, false);
