import { titleCase } from '../../../../shared/string-utils.js';

const packetName = new URLSearchParams(window.location.search).get('packetName');

/**
 * @param {string} value
 * @returns {string} the value quoted for CSV, with formula-leading characters neutralized.
 */
function csvField (value) {
  const text = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${text.replaceAll('"', '""')}"`;
}

function exportCsv (users) {
  const lines = [['username', 'email'], ...users.map(({ username, email }) => [username, email ?? ''])];
  const blob = new window.Blob([lines.map(line => line.map(csvField).join(',')).join('\r\n') + '\r\n'], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${packetName}-users.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

document.getElementById('packet-name').textContent = titleCase(packetName);

const { users } = await fetch('/api/geoword/admin/users?' + new URLSearchParams({ packetName })).then(response => response.json());

document.getElementById('user-table-body').replaceChildren(...users.map(({ username, email }) => {
  const row = document.createElement('tr');
  for (const text of [username, email ?? '']) {
    const cell = document.createElement('td');
    cell.textContent = text;
    row.appendChild(cell);
  }
  return row;
}));

document.getElementById('total-users').textContent = users.length;
document.getElementById('spinner').classList.add('d-none');
document.getElementById('empty').classList.toggle('d-none', users.length > 0);
document.getElementById('user-table').classList.toggle('d-none', users.length === 0);

const exportButton = document.getElementById('export-csv');
exportButton.disabled = users.length === 0;
exportButton.addEventListener('click', () => exportCsv(users));
