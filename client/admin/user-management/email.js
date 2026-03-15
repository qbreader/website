document.getElementById('verify-email-form').addEventListener('submit', function (event) {
  event.preventDefault();
  const username = document.getElementById('username').value.trim();
  if (!username) return;

  document.getElementById('submit').disabled = true;
  document.getElementById('submit').textContent = 'Verifying...';

  fetch('/api/admin/user-management/verify-email', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username })
  }).then(async response => {
    const text = await response.text();
    if (response.ok) {
      window.alert(text || 'Email verified successfully.');
    } else {
      window.alert(text || 'An error occurred.');
    }
  }).catch(() => {
    window.alert('An error occurred.');
  }).finally(() => {
    document.getElementById('submit').disabled = false;
    document.getElementById('submit').textContent = 'Verify Email';
  });
});
