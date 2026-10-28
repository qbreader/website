import escapeCSVField from '../../../../shared/escape-csv-field.js';
import { titleCase } from '../../../../shared/string-utils.js';
import { attachTableEventListeners } from '../../../scripts/utilities/tables.js';

const packetName = new URLSearchParams(window.location.search).get('packetName');

function exportCsv (users) {
  const lines = [['username', 'email', 'registered_at', 'team'], ...users.map(({ username, email, registeredAt, teamName }) => [username, email ?? '', registeredAt, teamName ?? ''])];
  const blob = new window.Blob([lines.map(line => line.map(value => escapeCSVField(value, { neutralizeFormulas: true })).join(',')).join('\r\n') + '\r\n'], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${packetName}-users.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

document.getElementById('packet-name').textContent = titleCase(packetName);

const { users } = await fetch('/api/geoword/admin/users?' + new URLSearchParams({ packetName })).then(response => response.json());

document.getElementById('user-table-body').replaceChildren(...users.map(({ username, email, registeredAt, teamName }) => {
  const row = document.createElement('tr');
  for (const text of [username, email ?? '', new Date(registeredAt).toLocaleString('sv-SE')]) {
    const cell = document.createElement('td');
    cell.textContent = text;
    row.appendChild(cell);
  }
  const teamCell = document.createElement('td');
  teamCell.className = 'small text-truncate';
  teamCell.style.maxWidth = '16rem';
  teamCell.textContent = teamName ?? '';
  teamCell.title = teamName ?? '';
  row.appendChild(teamCell);
  return row;
}));

document.getElementById('total-users').textContent = users.length;
document.getElementById('spinner').classList.add('d-none');
document.getElementById('empty').classList.toggle('d-none', users.length > 0);
document.getElementById('user-table').classList.toggle('d-none', users.length === 0);

const exportButton = document.getElementById('export-csv');
exportButton.disabled = users.length === 0;
exportButton.addEventListener('click', () => exportCsv(users));

attachTableEventListeners({
  tableId: 'user-table-body',
  isNumericColumn: [false, false, false, false],
  headers: 0,
  footers: 0
});
