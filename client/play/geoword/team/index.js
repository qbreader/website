import { titleCase } from '../../../../shared/string-utils.js';

const setName = new URLSearchParams(window.location.search).get('setName') ?? '';

document.getElementById('set-name').textContent = titleCase(setName);

function showTeam ({ teamName }) {
  document.getElementById('form').classList.add('d-none');
  document.getElementById('current-team-name').textContent = teamName;
  document.getElementById('current-team').classList.remove('d-none');
}

document.getElementById('form').addEventListener('submit', async event => {
  event.preventDefault();
  event.stopPropagation();

  document.getElementById('error').textContent = '';
  document.getElementById('submit').disabled = true;

  const response = await fetch('/api/geoword/team/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      setName,
      teamName: document.getElementById('team-name').value
    })
  });

  if (response.ok) {
    showTeam((await response.json()).team);
  } else {
    document.getElementById('error').textContent = response.status === 401
      ? 'You must log in first.'
      : await response.text();
    document.getElementById('submit').disabled = false;
  }
});

const response = await fetch('/api/geoword/team/mine?' + new URLSearchParams({ setName }));

if (response.status === 401) {
  document.getElementById('login-warning').classList.remove('d-none');
} else if (response.ok) {
  const { team } = await response.json();

  if (team) {
    showTeam(team);
  } else {
    document.getElementById('form').classList.remove('d-none');
  }
} else {
  document.getElementById('set-name').textContent = 'an unknown set';
}
