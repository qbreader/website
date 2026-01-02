import account from '../scripts/accounts.js';

const form = document.getElementById('signup-form');
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  event.stopPropagation();
  form.classList.add('was-validated');

  if (!form.checkValidity()) {
    return;
  }

  if (document.getElementById('new-password').value !== document.getElementById('confirm-password').value) {
    document.getElementById('old-password').value = '';
    document.getElementById('new-password').value = '';
    document.getElementById('confirm-password').value = '';
    return;
  }

  document.getElementById('submission').textContent = 'Submitting...';

  const username = await account.getUsername();
  fetch('/auth/edit-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      oldPassword: document.getElementById('old-password').value,
      newPassword: document.getElementById('new-password').value
    })
  }).then(async function (response) {
    if (response.status === 200) {
      const { expires } = await response.json();
      window.sessionStorage.setItem('account-username', JSON.stringify({ username, expires }));
      window.location.href = '/user/';
    } else {
      document.getElementById('submission').textContent = 'Submit';
      document.getElementById('old-password').value = '';
      document.getElementById('new-password').value = '';
      document.getElementById('confirm-password').value = '';
      window.alert('Make sure your password is correct.');
    }
  });
}, false);
