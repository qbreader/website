import { titleCase } from '../../../../shared/string-utils.js';

const packetName = new URLSearchParams(window.location.search).get('packetName');

document.getElementById('packet-name').textContent = titleCase(packetName);

const { teamList, divisions, maxSize } = await fetch('/api/geoword/admin/team-list?' + new URLSearchParams({ packetName })).then(response => response.json());

document.getElementById('team-table-body').replaceChildren(...teamList.map(({ teamName, memberCount }) => {
  const links = document.createElement('td');
  for (const division of divisions) {
    const link = document.createElement('a');
    link.className = 'me-3';
    link.href = '/play/geoword/results/team?' + new URLSearchParams({ packetName, teamName, division });
    link.textContent = division;
    links.appendChild(link);
  }

  const row = document.createElement('tr');
  for (const text of [teamName, memberCount]) {
    const cell = document.createElement('td');
    cell.textContent = text;
    row.appendChild(cell);
  }
  row.appendChild(links);
  return row;
}));

if (maxSize !== null) {
  document.getElementById('max-size-value').textContent = maxSize;
  document.getElementById('max-size').classList.remove('d-none');
}

document.getElementById('empty').classList.toggle('d-none', teamList.length > 0);
document.getElementById('team-table').classList.toggle('d-none', teamList.length === 0);
