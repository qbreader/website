import { titleCase } from '../../../../shared/string-utils.js';

const packetName = new URLSearchParams(window.location.search).get('packetName');

document.getElementById('packet-name').textContent = titleCase(packetName);

const { teamList } = await fetch('/api/geoword/admin/team-list?' + new URLSearchParams({ packetName })).then(response => response.json());

document.getElementById('team-table-body').replaceChildren(...teamList.map(({ teamName, division, memberCount }) => {
  const link = document.createElement('a');
  link.href = '/play/geoword/results/team?' + new URLSearchParams({ packetName, teamName });
  link.textContent = teamName;

  const nameCell = document.createElement('td');
  nameCell.appendChild(link);

  const row = document.createElement('tr');
  for (const text of [division, memberCount]) {
    const cell = document.createElement('td');
    cell.textContent = text;
    row.appendChild(cell);
  }
  row.prepend(nameCell);
  return row;
}));

document.getElementById('empty').classList.toggle('d-none', teamList.length > 0);
document.getElementById('team-table').classList.toggle('d-none', teamList.length === 0);
