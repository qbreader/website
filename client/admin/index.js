import account from '../scripts/accounts.js';

const username = await account.getUsername();
if (username) {
  document.getElementById('welcome-username').textContent = username;
}

const deployButton = document.getElementById('deploy');
const deployStatus = document.getElementById('deploy-status');

deployButton.addEventListener('click', async () => {
  if (!window.confirm('Deploy the latest main to production? This restarts the server and disconnects active multiplayer rooms.')) { return; }

  deployButton.disabled = true;
  deployStatus.textContent = 'Starting deploy...';
  try {
    const response = await fetch('/api/admin/deploy', { method: 'POST' });
    if (!response.ok) { throw new Error(await response.text()); }
    deployStatus.textContent = 'Deploy started. Check the Heroku dashboard for progress.';
  } catch (error) {
    deployStatus.textContent = error.message || 'An error occurred.';
    deployButton.disabled = false;
  }
});
