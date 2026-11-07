import { titleCase } from '../../../../shared/string-utils.js';

const search = new URLSearchParams(window.location.search);
const packetName = search.get('packetName');

document.getElementById('packet-name').textContent = titleCase(packetName);

/**
 * Replaces the contents of a definition list with the given label/value pairs.
 * @param {string} id - the id of the `<dl>` element
 * @param {[string, string][]} rows
 */
function renderRows (id, rows) {
  const list = document.getElementById(id);
  list.replaceChildren();

  for (const [label, value] of rows) {
    const term = document.createElement('dt');
    term.className = 'col-sm-5';
    term.textContent = label;

    const description = document.createElement('dd');
    description.className = 'col-sm-7';
    description.textContent = value;

    list.append(term, description);
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
    ['Name', titleCase(packetInfo.name)],
    ['Divisions', divisions.join(', ')],
    ['Questions per division', questionCount],
    ['Cost', `$${(costInCents / 100).toFixed(2)}`]
  ]);

  renderRows('set-info', set
    ? [
        ['Name', set.name],
        ['Teams', set.teamsEnabled ? 'Enabled' : 'Disabled']
      ]
    : [['Name', 'This packet is not part of a set']]);

  renderVisibility(hidden);
} else {
  document.getElementById('packet-info').textContent = 'Could not load this packet.';
}
