import { titleCase } from '../../scripts/utilities/strings.js';
import sortTable from '../../scripts/utilities/tables.js';

const search = new URLSearchParams(window.location.search);
const packetName = search.get('packetName');
const packetTitle = titleCase(packetName);
document.getElementById('packet-name').textContent = packetTitle;

for (const [index, th] of Array.from(document.getElementsByTagName('th')).entries()) {
  th.addEventListener('click', () => sortTable(index, false, 'payment-table'));
}

fetch('/api/admin/geoword/payment-list?' + new URLSearchParams({ packetName }))
  .then(response => response.json())
  .then(data => {
    const { payments } = data;
    for (const { username, createdAt, manual } of payments) {
      const row = document.getElementById('payment-table').insertRow();
      row.insertCell().textContent = username;
      row.insertCell().textContent = new Date(createdAt).toLocaleString();
      row.insertCell().textContent = manual ? 'Manual' : 'Automatic';
      row.insertCell().textContent = 'None';
    }
    document.getElementById('total-payments').textContent = payments.length;
    document.getElementById('spinner').classList.add('d-none');
  });

document.getElementById('record-payment-form').addEventListener('submit', event => {
  event.preventDefault();
  event.stopPropagation();

  const username = document.getElementById('username').value;
  document.getElementById('username').value = '';

  fetch('/api/admin/geoword/record-payment', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, packetName })
  }).then(response => {
    switch (response.status) {
      case 200: return window.location.reload();
      case 400: return window.alert('User not found');
      default: return window.alert('Something went wrong. Please try again.');
    }
  });
});
