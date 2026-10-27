import { titleCase } from '../../../../shared/string-utils.js';

const TOOL_GROUPS = [
  {
    label: 'Results',
    color: 'primary',
    tools: [
      ['Stats', '/play/geoword/admin/stats'],
      ['Category Stats', '/play/geoword/admin/category-stats'],
      ['Leaderboard', '/play/geoword/admin/leaderboard'],
      ['Team Leaderboard', '/play/geoword/results/team-leaderboard'],
      ['Teams', '/play/geoword/admin/teams']
    ]
  },
  {
    label: 'Manage',
    color: 'success',
    tools: [
      ['Protests', '/play/geoword/admin/protests'],
      ['Manage Payments', '/play/geoword/admin/manage-payments'],
      ['Users', '/play/geoword/admin/users']
    ]
  },
  {
    label: 'Questions',
    color: 'secondary',
    tools: [
      ['Packet', '/play/geoword/results/packet/']
    ]
  }
];

/**
 * @param {string} packetName
 * @param {boolean} hidden - whether the packet is currently hidden from players
 * @returns {HTMLDivElement} a status badge and a button that publishes or unpublishes the packet
 */
function createPublishControl (packetName, hidden) {
  const status = document.createElement('span');
  const button = document.createElement('button');
  button.type = 'button';

  function render () {
    status.className = `badge ${hidden ? 'text-bg-secondary' : 'text-bg-success'}`;
    status.textContent = hidden ? 'Hidden' : 'Published';
    button.className = `btn btn-sm ${hidden ? 'btn-success' : 'btn-warning'}`;
    button.textContent = hidden ? 'Publish' : 'Unpublish';
  }

  button.addEventListener('click', async () => {
    if (!hidden && !window.confirm(`Hide ${titleCase(packetName)} from players?`)) { return; }

    const response = await fetch('/api/geoword/admin/published?' + new URLSearchParams({ packetName, published: hidden }), { method: 'PUT' });
    if (response.ok) {
      hidden = !hidden;
      render();
    } else {
      window.alert('Something went wrong. Please try again.');
    }
  });

  render();

  const control = document.createElement('div');
  control.className = 'd-flex align-items-center gap-2';
  control.append(status, button);
  return control;
}

fetch('/api/geoword/admin/packet-list')
  .then(response => response.json())
  .then(data => {
    const { packetList } = data;
    const container = document.getElementById('packet-list');
    packetList.forEach(game => {
      const { name, test } = game;

      const title = document.createElement('h5');
      title.className = 'card-title';
      title.textContent = titleCase(name);

      const cardBody = document.createElement('div');
      cardBody.className = 'card-body';
      cardBody.appendChild(title);

      for (const { label, color, tools } of TOOL_GROUPS) {
        const groupLabel = document.createElement('div');
        groupLabel.className = 'text-body-secondary small mt-2 mb-1';
        groupLabel.textContent = label;

        const links = document.createElement('div');
        links.className = 'd-flex flex-wrap gap-2';
        for (const [text, path] of tools) {
          const a = document.createElement('a');
          a.className = `btn btn-sm btn-${color}`;
          a.href = `${path}?packetName=${name}`;
          a.textContent = text;
          links.appendChild(a);
        }

        cardBody.appendChild(groupLabel);
        cardBody.appendChild(links);
      }

      const visibilityLabel = document.createElement('div');
      visibilityLabel.className = 'text-body-secondary small mt-2 mb-1';
      visibilityLabel.textContent = 'Visibility';
      cardBody.append(visibilityLabel, createPublishControl(name, !!test));

      const card = document.createElement('div');
      card.className = 'card h-100';
      card.appendChild(cardBody);

      const col = document.createElement('div');
      col.className = 'col';
      col.appendChild(card);

      container.appendChild(col);
    });
  });
