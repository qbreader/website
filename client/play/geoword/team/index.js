import { titleCase } from '../../../../shared/string-utils.js';

const setName = new URLSearchParams(window.location.search).get('setName') ?? '';

document.getElementById('set-name').textContent = titleCase(setName);

/**
 * @param {string} action
 * @param {object} [body]
 * @returns {Promise<Response>}
 */
function postTeamAction (action, body = {}) {
  return fetch('/api/geoword/team/' + action, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ setName, ...body })
  });
}

function createMemberItem ({ username, isOwner }, viewerIsOwner) {
  const li = document.createElement('li');
  li.className = 'list-group-item d-flex align-items-center';

  const name = document.createElement('span');
  name.className = 'me-auto';
  name.textContent = username;
  li.appendChild(name);

  if (isOwner) {
    const badge = document.createElement('span');
    badge.className = 'badge text-bg-secondary';
    badge.textContent = 'Owner';
    li.appendChild(badge);
  } else if (viewerIsOwner) {
    const makeOwner = document.createElement('button');
    makeOwner.type = 'button';
    makeOwner.className = 'btn btn-sm btn-outline-secondary me-2';
    makeOwner.textContent = 'Make owner';
    makeOwner.addEventListener('click', async () => {
      if (!window.confirm(`Make ${username} the owner? You will no longer be able to rename the team or remove players.`)) { return; }
      await runMemberAction('transfer', username);
    });

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'btn btn-sm btn-outline-danger';
    remove.textContent = 'Remove';
    remove.addEventListener('click', async () => {
      if (!window.confirm(`Remove ${username} from the team?`)) { return; }
      await runMemberAction('remove', username);
    });

    li.append(makeOwner, remove);
  }

  return li;
}

async function runMemberAction (action, username) {
  const response = await postTeamAction(action, { username });
  if (response.ok) {
    window.location.reload();
  } else {
    window.alert(await response.text() || 'Something went wrong. Please try again.');
  }
}

function showTeam ({ teamName, code, members, isOwner }) {
  document.getElementById('form').classList.add('d-none');
  document.getElementById('join-form').classList.add('d-none');
  document.getElementById('team-code').textContent = code;
  document.getElementById('member-list').replaceChildren(...members.map(member => createMemberItem(member, isOwner)));
  document.getElementById('rename-form').classList.toggle('d-none', !isOwner);
  document.getElementById('rename-team-name').value = teamName;
  document.getElementById('team-details').classList.remove('d-none');
  document.getElementById('current-team-name').textContent = teamName;
  document.getElementById('current-team').classList.remove('d-none');
}

document.getElementById('form').addEventListener('submit', async event => {
  event.preventDefault();
  event.stopPropagation();

  document.getElementById('error').textContent = '';
  document.getElementById('submit').disabled = true;

  const response = await postTeamAction('create', {
    teamName: document.getElementById('team-name').value
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

  const response = await postTeamAction('join', {
    teamName: document.getElementById('join-team-name').value,
    code: document.getElementById('join-code').value
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

  const response = await postTeamAction('leave');

  if (response.ok) {
    window.location.reload();
  } else {
    document.getElementById('leave-error').textContent = await response.text() || 'Something went wrong. Please try again.';
  }
});

document.getElementById('rename-form').addEventListener('submit', async event => {
  event.preventDefault();
  event.stopPropagation();

  document.getElementById('rename-error').textContent = '';
  const response = await postTeamAction('rename', { teamName: document.getElementById('rename-team-name').value });

  if (response.ok) {
    window.location.reload();
  } else {
    document.getElementById('rename-error').textContent = await response.text();
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
