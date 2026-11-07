import { titleCase } from '../../../../shared/string-utils.js';

const search = new URLSearchParams(window.location.search);
const packetName = search.get('packetName');

document.getElementById('packet-name').textContent = titleCase(packetName);

/**
 * Replaces the contents of a container with the given label/value pairs, each shown as a bold label with its value underneath.
 * @param {string} id - the id of the container element
 * @param {[string, string][]} rows
 */
function renderRows (id, rows) {
  const container = document.getElementById(id);
  container.replaceChildren();

  for (const [label, value] of rows) {
    const term = document.createElement('div');
    term.className = 'fw-bold';
    term.textContent = label;

    const description = document.createElement('div');
    description.textContent = value;

    const item = document.createElement('div');
    item.className = 'col mb-2';
    item.append(term, description);

    container.append(item);
  }
}

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

  renderRows('packet-info', [
    ['Packet', titleCase(packetInfo.name)],
    ['Set', set ? set.name : 'None'],
    ['Questions', questionCount],
    ['Cost', `$${(costInCents / 100).toFixed(2)}`],
    ['Divisions', divisions.join(', ')],
    ...(set ? [['Teams', set.teamsEnabled ? 'Enabled' : 'Disabled']] : [])
  ]);

  renderVisibility(hidden);
} else {
  document.getElementById('packet-info').textContent = 'Could not load this packet.';
}
