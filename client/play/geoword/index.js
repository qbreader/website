import account from '../../scripts/accounts.js';
import { titleCase } from '../../../shared/string-utils.js';

account.getUsername().then(username => {
  if (username) {
    document.getElementById('login-warning').classList.add('d-none');
  }
});

fetch('/api/geoword/has-admin-access')
  .then(response => response.json())
  .then(data => {
    if (data.hasAdminAccess) {
      document.getElementById('admin-link-container').classList.remove('d-none');
    }
  });

/**
 * @param {Array<{ name: string, set?: { name: string } }>} packetList
 * @returns {Map<string, object[]>}
 */
function groupBySet (packetList) {
  const packetsBySet = new Map();
  for (const packet of packetList) {
    const setName = packet.set?.name ?? 'other';
    packetsBySet.set(setName, [...packetsBySet.get(setName) ?? [], packet]);
  }
  return packetsBySet;
}

/**
 * @param {string} setName
 * @param {object[]} packetList
 * @param {boolean} hasRegistration
 * @param {boolean} onTeam
 * @returns {HTMLDivElement}
 */
function createSetCard (setName, packetList, hasRegistration, onTeam) {
  const title = document.createElement('h5');
  title.className = 'card-title';
  title.textContent = titleCase(setName);

  const buttons = document.createElement('div');
  buttons.className = 'd-flex flex-wrap gap-2';
  for (const packet of packetList) {
    const a = document.createElement('a');
    a.className = 'btn btn-primary';
    a.href = './' + (packet.costInCents ? 'payment' : 'division/') + '?packetName=' + packet.name;
    a.textContent = titleCase(packet.name);
    buttons.appendChild(a);
  }

  const cardBody = document.createElement('div');
  cardBody.className = 'card-body';
  cardBody.append(title, buttons);

  const card = document.createElement('div');
  card.className = 'card h-100';
  card.appendChild(cardBody);

  if (onTeam || hasRegistration) {
    const a = document.createElement('a');
    a.className = onTeam ? 'btn btn-secondary btn-sm' : 'btn btn-outline-secondary btn-sm';
    a.href = './team/?' + new URLSearchParams({ setName });
    a.textContent = onTeam ? 'Your team' : 'Create or join a team';

    const footer = document.createElement('div');
    footer.className = 'card-footer';
    footer.appendChild(a);
    card.appendChild(footer);
  }

  const col = document.createElement('div');
  col.className = 'col';
  col.appendChild(card);
  return col;
}

Promise.all([
  fetch('/api/geoword/packet-list').then(response => response.json()),
  fetch('/api/geoword/set-list').then(response => response.json()),
  fetch('/api/geoword/my-teams').then(response => response.json())
]).then(([{ packetList }, { setList }, { setNames }]) => {
  const registrationSets = new Set(setList.map(set => set.name));
  const teamSets = new Set(setNames);
  document.getElementById('set-list').replaceChildren(
    ...Array.from(groupBySet(packetList), ([setName, setPackets]) => createSetCard(setName, setPackets, registrationSets.has(setName), teamSets.has(setName)))
  );
});
