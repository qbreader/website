const CONFIG_ID = 'feature-of-the-day';
const markdownInput = document.getElementById('markdown');
const submitButton = document.getElementById('submit');

document.getElementById('site-config-form').addEventListener('submit', function (event) {
  event.preventDefault();

  submitButton.disabled = true;
  submitButton.textContent = 'Saving...';

  fetch(`/api/admin/site-config/${CONFIG_ID}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ markdown: markdownInput.value })
  }).then(async response => {
    if (response.ok) {
      window.alert('Saved.');
    } else {
      window.alert(await response.text() || 'An error occurred.');
    }
  }).catch(() => {
    window.alert('An error occurred.');
  }).finally(() => {
    submitButton.disabled = false;
    submitButton.textContent = 'Save';
  });
});

fetch(`/api/admin/site-config/${CONFIG_ID}`).then(async response => {
  if (!response.ok) { throw new Error(); }
  markdownInput.value = (await response.json()).markdown;
}).catch(() => {
  window.alert('Failed to load the current text.');
});
