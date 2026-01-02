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
