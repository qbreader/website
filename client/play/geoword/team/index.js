import { titleCase } from '../../../../shared/string-utils.js';

const setName = new URLSearchParams(window.location.search).get('setName') ?? '';

document.getElementById('set-name').textContent = titleCase(setName);

function showTeam ({ teamName, code, memberCount }) {
  document.getElementById('form').classList.add('d-none');
  document.getElementById('join-form').classList.add('d-none');
  document.getElementById('team-code').textContent = code;
  document.getElementById('member-count').textContent = memberCount;
  document.getElementById('team-details').classList.remove('d-none');
  document.getElementById('current-team-name').textContent = teamName;
  document.getElementById('current-team').classList.remove('d-none');
}

document.getElementById('form').addEventListener('submit', async event => {
  // Need event.preventDefault() for firefox only!!!
  // See https://stackoverflow.com/a/70780452
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

document.getElementById('join-form').addEventListener('submit', async event => {
  event.preventDefault();
  event.stopPropagation();

  document.getElementById('join-error').textContent = '';
  document.getElementById('join-submit').disabled = true;

  const response = await fetch('/api/geoword/team/join', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      setName,
      teamName: document.getElementById('join-team-name').value,
      code: document.getElementById('join-code').value
    })
  });

  if (response.ok) {
    showTeam((await response.json()).team);
  } else {
    document.getElementById('join-error').textContent = response.status === 429
      ? 'Too many attempts. Try again later.'
      : await response.text();
    document.getElementById('join-submit').disabled = false;
  }
});

document.getElementById('leave').addEventListener('click', async () => {
  if (!window.confirm('Leave your team? You will need its code to rejoin.')) { return; }

  const response = await fetch('/api/geoword/team/leave', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ setName })
  });

  if (response.ok) {
    window.location.reload();
  } else {
    window.alert('Something went wrong. Please try again.');
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
    document.getElementById('join-form').classList.remove('d-none');
  }
} else {
  document.getElementById('set-name').textContent = 'an unknown set';
}
