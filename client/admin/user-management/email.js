document.getElementById('verify-email-form').addEventListener('submit', function (event) {
  event.preventDefault();
  const username = document.getElementById('username').value.trim();
  if (!username) return;

  const resultDiv = document.getElementById('result');
  resultDiv.textContent = '';
  resultDiv.className = '';

  fetch('/api/admin/user-management/verify-email', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username })
  }).then(async response => {
    const text = await response.text();
    if (response.ok) {
      resultDiv.textContent = text || 'Email verified successfully.';
      resultDiv.className = 'alert alert-success mt-3';
    } else {
      resultDiv.textContent = text || 'An error occurred.';
      resultDiv.className = 'alert alert-danger mt-3';
    }
  }).catch(() => {
    resultDiv.textContent = 'Network error: Unable to connect to server.';
    resultDiv.className = 'alert alert-danger mt-3';
  });
});
