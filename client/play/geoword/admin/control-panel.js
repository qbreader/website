import { titleCase } from '../../../../shared/string-utils.js';

const search = new URLSearchParams(window.location.search);
const packetName = search.get('packetName');

document.getElementById('packet-name').textContent = titleCase(packetName);

/**
 * @param {boolean} hidden - whether the packet is currently hidden from players
 */
function renderVisibility (hidden) {
  const status = document.createElement('span');
  status.className = `badge ${hidden ? 'text-bg-secondary' : 'text-bg-success'}`;
  status.textContent = hidden ? 'Hidden' : 'Published';

  const button = document.createElement('button');
  button.type = 'button';
  button.className = `btn btn-sm ${hidden ? 'btn-success' : 'btn-warning'}`;
  button.textContent = hidden ? 'Publish' : 'Unpublish';

  button.addEventListener('click', async () => {
    if (!hidden && !window.confirm(`Hide ${titleCase(packetName)} from players?`)) { return; }

    button.disabled = true;
    const response = await fetch('/api/geoword/admin/published?' + new URLSearchParams({ packetName, published: hidden }), { method: 'PUT' });
    if (response.ok) {
      renderVisibility(!hidden);
    } else {
      button.disabled = false;
      window.alert('Something went wrong. Please try again.');
    }
  });

  document.getElementById('visibility-control').replaceChildren(status, button);
}

const response = await fetch('/api/geoword/admin/packet-info?' + new URLSearchParams({ packetName }));

if (response.ok) {
  const { packetInfo } = await response.json();
  const { divisions, questionCount, costInCents, hidden, set } = packetInfo;

  document.getElementById('info-packet').textContent = titleCase(packetInfo.name);
  document.getElementById('info-set').textContent = set ? set.name : 'None';
  document.getElementById('info-questions').textContent = questionCount;
  document.getElementById('info-cost').textContent = `$${(costInCents / 100).toFixed(2)}`;
  document.getElementById('info-divisions').textContent = divisions.join(', ');
  document.getElementById('info-teams-item').hidden = !set;
  if (set) {
    document.getElementById('info-teams').textContent = set.teamsEnabled ? 'Enabled' : 'Disabled';
  }

  renderVisibility(hidden);
} else {
  document.getElementById('packet-info').replaceChildren('Could not load this packet.');
}
