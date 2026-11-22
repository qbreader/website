import account from '../scripts/accounts.js';

const username = await account.getUsername();
if (username) {
  document.getElementById('welcome-username').textContent = username;
}

const deployButton = document.getElementById('deploy');
const deployStatus = document.getElementById('deploy-status');

// Resolves to the build's final status, or 'timeout'; requests fail while the server restarts, so they are retried
async function waitForBuild (id) {
  for (let attempt = 0; attempt < 240; attempt++) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    try {
      const response = await fetch(`/api/admin/deploy/${id}`);
      if (!response.ok) { continue; }
      const { status } = await response.json();
      if (status !== 'pending') { return status; }
    } catch {}
  }
  return 'timeout';
}

deployButton.addEventListener('click', async () => {
  if (!window.confirm('Deploy the latest main to production? This restarts the server and disconnects active multiplayer rooms.')) { return; }

  deployButton.disabled = true;
  deployStatus.textContent = 'Starting deploy...';
  try {
    const response = await fetch('/api/admin/deploy', { method: 'POST' });
    if (!response.ok) { throw new Error(await response.text()); }

    deployStatus.textContent = 'Building...';
    const status = await waitForBuild((await response.json()).id);
    deployStatus.textContent = status === 'succeeded' ? 'Deploy succeeded.' : 'Deploy failed or timed out. Check the Heroku dashboard.';
  } catch (error) {
    deployStatus.textContent = error.message || 'An error occurred.';
  } finally {
    deployButton.disabled = false;
  }
});
